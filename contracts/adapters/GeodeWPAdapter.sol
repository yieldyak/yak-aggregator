//       ╟╗                                                                      ╔╬
//       ╞╬╬                                                                    ╬╠╬
//      ╔╣╬╬╬                                                                  ╠╠╠╠╦
//     ╬╬╬╬╬╩                                                                  ╘╠╠╠╠╬
//    ║╬╬╬╬╬                                                                    ╘╠╠╠╠╬
//    ╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬      ╒╬╬╬╬╬╬╬╜   ╠╠╬╬╬╬╬╬╬         ╠╬╬╬╬╬╬╬    ╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╠
//    ╙╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬╕    ╬╬╬╬╬╬╬╜   ╣╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬   ╬╬╬╬╬╬╬╬╬╠╠╠╠╠╠╠╩
//     ╙╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬╬  ╔╬╬╬╬╬╬╬    ╔╠╠╠╬╬╬╬╬╬╬╬        ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬╬╬╬╬╠╠╠╠╝╙
//               ╘╣╬╬╬╬╬╬╬╬╬╬╬╬╬╬    ╒╠╠╠╬╠╬╩╬╬╬╬╬╬       ╠╬╬╬╬╬╬╬╣╬╬╬╬╬╬╬╙
//                 ╣╬╬╬╬╬╬╬╬╬╬╠╣     ╣╬╠╠╠╬╩ ╚╬╬╬╬╬╬      ╠╬╬╬╬╬╬╬╬╬╬╬╬╬╬
//                  ╣╬╬╬╬╬╬╬╬╬╣     ╣╬╠╠╠╬╬   ╣╬╬╬╬╬╬     ╠╬╬╬╬╬╬╬╬╬╬╬╬╬╬
//                   ╟╬╬╬╬╬╬╬╩      ╬╬╠╠╠╠╬╬╬╬╬╬╬╬╬╬╬     ╠╬╬╬╬╬╬╬╠╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬     ╒╬╬╠╠╬╠╠╬╬╬╬╬╬╬╬╬╬╬╬    ╠╬╬╬╬╬╬╬ ╣╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬     ╬╬╬╠╠╠╠╝╝╝╝╝╝╝╠╬╬╬╬╬╬   ╠╬╬╬╬╬╬╬  ╚╬╬╬╬╬╬╬╬
//                    ╬╬╬╬╬╬╬    ╣╬╬╬╬╠╠╩       ╘╬╬╬╬╬╬╬  ╠╬╬╬╬╬╬╬   ╙╬╬╬╬╬╬╬╬
//                              

// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.7.0;

import "../interface/IGeodePortal.sol";
import "../interface/IGeodeWP.sol";
import "../interface/IgAVAX.sol";
import "../interface/IERC20.sol";
import "../interface/IWETH.sol";
import "../YakAdapter.sol";

contract GeodeWPAdapter is YakAdapter {

    bytes32 constant id = keccak256("GeodeWPAdapter");
    uint constant gAVAX_DENOMINATOR = 1e18;
    uint constant IGNORABLE_DEBT = 1e15;

    uint public pooledTknId;
    address public pooledTknInterface;
    address public portal;
    address public gavax;
    address public pool;

    constructor (
        string memory _name, 
        address _portal,
        uint _pooledTknId,
        uint _swapGasEstimate
    ) {
        pooledTknId = _pooledTknId;
        portal = _portal;
        name = _name;
        pooledTknInterface = IGeodePortal(_portal).planetCurrentInterface(
            pooledTknId
        );
        pool = IGeodePortal(_portal).planetWithdrawalPool(pooledTknId);
        gavax = IGeodePortal(_portal).gAVAX();
        setSwapGasEstimate(_swapGasEstimate);
        setAllowances();
    }

    function setInterfaceForPooledTkn(
        address interfaceAddress
    ) public onlyOwner {
        require(
            IgAVAX(gavax).isInterface(
                interfaceAddress, 
                pooledTknId
            ), 
            "Not interface for the pooled token"
        );
        pooledTknInterface = interfaceAddress;
    }

    function onERC1155Received(
        address, 
        address, 
        uint256, 
        uint256, 
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function setAllowances() public override onlyOwner {
        IgAVAX(gavax).setApprovalForAll(pool, true);
    }

    function revokeAllowance() public onlyOwner {
        IgAVAX(gavax).setApprovalForAll(pool, false);
    }

    function _supportedTokens(
        address tknIn, 
        address tknOut
    ) internal view returns (bool) {
        return (tknOut == WAVAX && tknIn == pooledTknInterface)
            || (tknIn == WAVAX && tknOut == pooledTknInterface);
    }

    function _stakingPaused() internal view returns (bool) {
        // Geode naming of method `isStakingPausedForPool` is counter-intuitive
        return !IGeodePortal(portal).isStakingPausedForPool(pooledTknId);
    }

    function _calcSwap(
        uint8 tknInIndex,
        uint8 tknOutIndex,
        uint amountIn
    ) internal view returns (uint) {
        try IGeodeWP(pool).calculateSwap(
            tknInIndex, 
            tknOutIndex, 
            amountIn
        ) returns (uint amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }

    function _calculateMint(uint amountIn) internal view returns (uint) {
        uint price = IgAVAX(gavax).pricePerShare(pooledTknId);
        return amountIn * gAVAX_DENOMINATOR / price;
    }

    function _calcSwapAndMint(uint amountIn) internal view returns (uint) {
        uint debt = IGeodeWP(pool).getDebt();
        if (debt >= amountIn || _stakingPaused()) {
            // If pool is unbalanced and missing avax it's cheaper to swap
            return _calcSwap(0, 1, amountIn);
        } else {
            // Swap debt and mint the rest
            uint amountOutBought;
            if (debt > IGNORABLE_DEBT)
                amountOutBought = _calcSwap(0, 1, debt);
            uint amountOutMinted = _calculateMint(amountIn - debt);
            return amountOutBought + amountOutMinted;
        }
    }

    function _query(
        uint _amountIn, 
        address _tokenIn, 
        address _tokenOut
    ) internal override view returns (uint) {
        if (_amountIn == 0 || _tokenIn == _tokenOut || IGeodeWP(pool).paused())
            return 0;
        if (_tokenIn == WAVAX && _tokenOut == pooledTknInterface)
            return _calcSwapAndMint(_amountIn);
        if (_tokenOut == WAVAX && _tokenIn == pooledTknInterface)
            return _calcSwap(1, 0, _amountIn);
    }

    function _swapUnderlying(
        uint8 _tokenInIndex,
        uint8 _tokenOutIndex,
        uint _amountIn, 
        uint _amountOut,
        uint _val
    ) internal {        
        IGeodeWP(pool).swap{ value: _val }(
            _tokenInIndex, 
            _tokenOutIndex,
            _amountIn, 
            _amountOut, 
            block.timestamp
        );
    }

    function _geodeStake(
        uint _amountIn, 
        uint _amountOut
    ) internal {
        IGeodePortal(portal).stake{ value: _amountIn }(
            pooledTknId, 
            _amountOut, 
            block.timestamp
        );
    }

    function _swap(
        uint _amountIn, 
        uint _amountOut, 
        address _tokenIn, 
        address _tokenOut, 
        address _to
    ) internal override {
        if (_tokenIn == WAVAX) {
            IWETH(WAVAX).withdraw(_amountIn);
            if (_stakingPaused())
                _swapUnderlying(0, 1, _amountIn, _amountOut, _amountIn);
            else 
                _geodeStake(_amountIn, _amountOut);
        } else {
            _swapUnderlying(1, 0, _amountIn, _amountOut, 0);
            IWETH(WAVAX).deposit{ value: address(this).balance }();
        }
        _returnTo(_tokenOut, IERC20(_tokenOut).balanceOf(address(this)), _to);
    }

    function _approveIfNeeded(address, uint) internal override {}

}