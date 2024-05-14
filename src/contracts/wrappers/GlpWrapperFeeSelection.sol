// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../YakWrapper.sol";
import "../interface/IGmxVault.sol";
import "../interface/IGlpManager.sol";
import "../interface/IGmxRewardRouter.sol";
import "../interface/IERC20.sol";
import "../lib/SafeERC20.sol";

contract GlpWrapperFeeSelection is YakWrapper {
    using SafeERC20 for IERC20;

    struct Fee {
        address token;
        uint256 basisPoints;
    }

    uint256 public constant BASIS_POINTS_DIVISOR = 1e4;
    uint256 public constant PRICE_PRECISION = 1e30;

    address public immutable USDG;
    address public immutable GLP;
    address public immutable sGLP;
    address public immutable vault;
    address public immutable rewardRouter;
    address public immutable glpManager;
    address public immutable vaultUtils;

    address[] public whitelistedTokens;
    uint256 public feeUsdgAmount;
    uint256 public inOutCount;
    mapping(address => bool) public isWhitelisted;

    constructor(
        string memory _name,
        uint256 _gasEstimate,
        address _gmxRewardRouter,
        address[] memory _whiteListedTokens,
        uint256 _feeUsdgAmount,
        uint256 _inOutCount,
        address _glp,
        address _sGlp
    ) YakWrapper(_name, _gasEstimate) {
        address gmxGLPManager = IGmxRewardRouter(_gmxRewardRouter).glpManager();
        address gmxVault = IGlpManager(gmxGLPManager).vault();
        USDG = IGmxVault(gmxVault).usdg();

        address utils;
        try IGmxVault(gmxVault).vaultUtils() returns (IGmxVaultUtils gmxVaultUtils) {
            utils = address(gmxVaultUtils);
        } catch {}
        vaultUtils = utils;

        rewardRouter = _gmxRewardRouter;
        setWhitelistedTokens(_whiteListedTokens);
        feeUsdgAmount = _feeUsdgAmount;
        inOutCount = _inOutCount;
        vault = gmxVault;
        glpManager = gmxGLPManager;
        GLP = _glp;
        sGLP = _sGlp;
    }

    function setWhitelistedTokens(address[] memory tokens) public onlyMaintainer {
        for (uint256 i = 0; i < whitelistedTokens.length; i++) {
            isWhitelisted[whitelistedTokens[i]] = false;
        }
        whitelistedTokens = tokens;
        for (uint256 i = 0; i < tokens.length; i++) {
            isWhitelisted[tokens[i]] = true;
        }
    }

    function updateFeeSelectionProperties(uint256 _usdgAmount, uint256 _inOutCount) public onlyMaintainer {
        feeUsdgAmount = _usdgAmount > 0 ? _usdgAmount : feeUsdgAmount;
        inOutCount = _inOutCount > 0 ? _inOutCount : inOutCount;
    }

    function getWrappedToken() external view override returns (address) {
        return sGLP;
    }

    function getTokensIn() external view override returns (address[] memory) {
        Fee[] memory fees = _getFees(true);
        return extractLowestFees(fees);
    }

    function getTokensOut() external view override returns (address[] memory) {
        Fee[] memory fees = _getFees(false);
        return extractLowestFees(fees);
    }

    function extractLowestFees(Fee[] memory fees) internal view returns (address[] memory tokensIn) {
        tokensIn = new address[](fees.length >= inOutCount ? inOutCount : fees.length);
        for (uint256 i; i < tokensIn.length; i++) {
            tokensIn[i] = fees[i].token;
        }
    }

    function _getFees(bool _buyGLP) internal view returns (Fee[] memory) {
        uint256 length = whitelistedTokens.length;
        uint256 mintBurnFeeBps = IGmxVault(vault).mintBurnFeeBasisPoints();
        uint256 taxBps = IGmxVault(vault).taxBasisPoints();
        Fee[] memory fees = new Fee[](length);
        for (uint256 i; i < length; i++) {
            address token = whitelistedTokens[i];
            fees[i] = Fee({
                token: token,
                basisPoints: IGmxVault(vault).getFeeBasisPoints(token, feeUsdgAmount, mintBurnFeeBps, taxBps, _buyGLP)
            });
        }
        return sort(fees);
    }

    function sort(Fee[] memory _fees) internal pure returns (Fee[] memory) {
        uint256 length = _fees.length;
        for (uint256 i = 1; i < length; i++) {
            Fee memory current = _fees[i];
            int256 j = int256(i - 1);
            while ((j >= 0) && (_fees[uint256(j)].basisPoints > current.basisPoints)) {
                _fees[uint256(j + 1)] = _fees[uint256(j)];
                j--;
            }
            _fees[uint256(j + 1)] = current;
        }
        return _fees;
    }

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        return (_tokenOut == sGLP) ? _quoteBuyGLP(_tokenIn, _amountIn) : _quoteSellGLP(_tokenOut, _amountIn);
    }

    function _quoteBuyGLP(address _tokenIn, uint256 _amountIn) internal view returns (uint256 amountOut) {
        uint256 aumInUsdg = IGlpManager(glpManager).getAumInUsdg(true);
        uint256 glpSupply = IERC20(GLP).totalSupply();
        uint256 price = IGmxVault(vault).getMinPrice(_tokenIn);
        uint256 usdgAmount = _calculateBuyUsdg(_amountIn, price, _tokenIn);
        amountOut = aumInUsdg == 0 ? usdgAmount : (usdgAmount * glpSupply) / aumInUsdg;
    }

    function _calculateBuyUsdg(
        uint256 _amountIn,
        uint256 _price,
        address _tokenIn
    ) internal view returns (uint256 amountOut) {
        amountOut = (_amountIn * _price) / PRICE_PRECISION;
        amountOut = IGmxVault(vault).adjustForDecimals(amountOut, _tokenIn, USDG);
        uint256 feeBasisPoints = _calculateBuyUsdgFeeBasisPoints(_tokenIn, amountOut);
        uint256 amountAfterFees = (_amountIn * (BASIS_POINTS_DIVISOR - feeBasisPoints)) / BASIS_POINTS_DIVISOR;
        amountOut = (amountAfterFees * _price) / PRICE_PRECISION;
        amountOut = IGmxVault(vault).adjustForDecimals(amountOut, _tokenIn, USDG);
    }

    function _quoteSellGLP(address _tokenOut, uint256 _amountIn) internal view returns (uint256 amountOut) {
        uint256 aumInUsdg = IGlpManager(glpManager).getAumInUsdg(false);
        uint256 glpSupply = IERC20(GLP).totalSupply();
        uint256 usdgAmount = (_amountIn * aumInUsdg) / glpSupply;
        uint256 redemptionAmount = IGmxVault(vault).getRedemptionAmount(_tokenOut, usdgAmount);
        uint256 feeBasisPoints = _calculateSellUsdgFeeBasisPoints(_tokenOut, usdgAmount);
        amountOut = (redemptionAmount * (BASIS_POINTS_DIVISOR - feeBasisPoints)) / BASIS_POINTS_DIVISOR;
    }

    function _calculateBuyUsdgFeeBasisPoints(address _tokenIn, uint256 _usdgAmount) internal view returns (uint256) {
        if (vaultUtils > address(0)) {
            return IGmxVaultUtils(vaultUtils).getBuyUsdgFeeBasisPoints(_tokenIn, _usdgAmount);
        }
        uint256 mintBurnFeeBps = IGmxVault(vault).mintBurnFeeBasisPoints();
        uint256 taxBps = IGmxVault(vault).taxBasisPoints();
        return IGmxVault(vault).getFeeBasisPoints(_tokenIn, _usdgAmount, mintBurnFeeBps, taxBps, true);
    }

    function _calculateSellUsdgFeeBasisPoints(address _tokenOut, uint256 _usdgAmount) internal view returns (uint256) {
        if (vaultUtils > address(0)) {
            return IGmxVaultUtils(vaultUtils).getSellUsdgFeeBasisPoints(_tokenOut, _usdgAmount);
        }
        uint feeBasisPoints = IGmxVault(vault).mintBurnFeeBasisPoints();
        uint taxBasisPoints = IGmxVault(vault).taxBasisPoints();
        if (!IGmxVault(vault).hasDynamicFees()) {
            return feeBasisPoints;
        }

        uint256 initialAmount = IGmxVault(vault).usdgAmounts(_tokenOut) - _usdgAmount;
        uint256 nextAmount = _usdgAmount > initialAmount ? 0 : initialAmount - _usdgAmount;

        uint256 targetAmount = IGmxVault(vault).getTargetUsdgAmount(_tokenOut);
        if (targetAmount == 0) {
            return feeBasisPoints;
        }

        uint256 initialDiff = initialAmount > targetAmount
            ? initialAmount - targetAmount
            : targetAmount - initialAmount;
        uint256 nextDiff = nextAmount > targetAmount ? nextAmount - targetAmount : targetAmount - nextAmount;

        if (nextDiff < initialDiff) {
            uint256 rebateBps = (taxBasisPoints * initialDiff) / targetAmount;
            return rebateBps > feeBasisPoints ? 0 : feeBasisPoints - rebateBps;
        }

        uint256 averageDiff = (initialDiff + nextDiff) / 2;
        if (averageDiff > targetAmount) {
            averageDiff = targetAmount;
        }
        uint256 taxBps = (taxBasisPoints * averageDiff) / targetAmount;
        return feeBasisPoints + taxBps;
    }

    function _calculateFeeBasisPoints(
        address _token,
        uint256 _usdgAmount,
        bool _buyUsdg
    ) internal view returns (uint256 feeBasisPoints) {}

    function calculateSellUsdgFeeBasisPoints(address _token, uint256 _usdgDelta) internal view returns (uint256) {}

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {}

    function swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _fromToken,
        address _toToken,
        address _to
    ) external override {
        uint256 toBalanceBefore = IERC20(_toToken).balanceOf(_to);
        if (_toToken == sGLP) {
            IERC20(_fromToken).approve(glpManager, _amountIn);
            uint256 amount = IGmxRewardRouter(rewardRouter).mintAndStakeGlp(_fromToken, _amountIn, 0, _amountOut);
            _returnTo(sGLP, amount, _to);
        } else {
            IGmxRewardRouter(rewardRouter).unstakeAndRedeemGlp(_toToken, _amountIn, _amountOut, _to);
        }
        uint256 diff = IERC20(_toToken).balanceOf(_to) - toBalanceBefore;
        require(diff >= _amountOut, "Insufficient amount-out");
        emit YakAdapterSwap(_fromToken, _toToken, _amountIn, _amountOut);
    }
}
