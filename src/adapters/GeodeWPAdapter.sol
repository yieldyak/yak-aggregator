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
pragma solidity ^0.8.0;

import "../interface/IGeodePortal.sol";
import "../interface/IGeodeWP.sol";
import "../interface/IgAVAX.sol";
import "../interface/IERC20.sol";
import "../interface/IWETH.sol";
import "../YakAdapter.sol";

contract GeodeWPAdapter is YakAdapter {
    address internal constant WAVAX = 0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7;
    uint256 internal constant gAVAX_DENOMINATOR = 1e18;
    uint256 internal constant IGNORABLE_DEBT = 1e18;
    uint256 public immutable pooledTknId;
    address public immutable portal;
    address public immutable gavax;
    address public immutable pool;
    address public pooledTknInterface;

    constructor(
        string memory _name,
        address _portal,
        uint256 _pooledTknId,
        uint256 _swapGasEstimate
    ) YakAdapter(_name, _swapGasEstimate) {
        pooledTknInterface = IGeodePortal(_portal).planetCurrentInterface(_pooledTknId);
        address _pool = IGeodePortal(_portal).planetWithdrawalPool(_pooledTknId);
        address _gavax = IGeodePortal(_portal).gAVAX();
        IgAVAX(_gavax).setApprovalForAll(_pool, true);
        pooledTknId = _pooledTknId;
        portal = _portal;
        gavax = _gavax;
        pool = _pool;
    }

    function setInterfaceForPooledTkn(address interfaceAddress) public onlyMaintainer {
        require(IgAVAX(gavax).isInterface(interfaceAddress, pooledTknId), "Not valid interface");
        pooledTknInterface = interfaceAddress;
    }

    function setGAvaxAllowance() public onlyMaintainer {
        IgAVAX(gavax).setApprovalForAll(pool, true);
    }

    function revokeGAvaxAllowance() public onlyMaintainer {
        IgAVAX(gavax).setApprovalForAll(pool, false);
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

    function _query(
        uint256 _amountIn,
        address _tokenIn,
        address _tokenOut
    ) internal view override returns (uint256 amountOut) {
        if (_amountIn == 0 || IGeodeWP(pool).paused()) {
            amountOut = 0;
        } else if (_tokenIn == WAVAX && _tokenOut == pooledTknInterface) {
            amountOut = _calcSwapAndMint(_amountIn);
        } else if (_tokenOut == WAVAX && _tokenIn == pooledTknInterface) {
            amountOut = _calcSwap(1, 0, _amountIn);
        }
    }

    function _calcSwapAndMint(uint256 amountIn) internal view returns (uint256) {
        uint256 debt = IGeodeWP(pool).getDebt();
        if (debt >= amountIn || _stakingPaused()) {
            // If pool is unbalanced and missing avax it's cheaper to swap
            return _calcSwap(0, 1, amountIn);
        } else {
            // Swap debt and mint the rest
            uint256 amountOutBought;
            if (debt > IGNORABLE_DEBT) {
                amountOutBought = _calcSwap(0, 1, debt);
                amountIn -= debt;
            }
            uint256 amountOutMinted = _calcMint(amountIn);
            return amountOutBought + amountOutMinted;
        }
    }

    function _stakingPaused() internal view returns (bool) {
        return IGeodePortal(portal).isStakingPausedForPool(pooledTknId);
    }

    function _calcSwap(
        uint8 tknInIndex,
        uint8 tknOutIndex,
        uint256 amountIn
    ) internal view returns (uint256) {
        try IGeodeWP(pool).calculateSwap(tknInIndex, tknOutIndex, amountIn) returns (uint256 amountOut) {
            return amountOut;
        } catch {
            return 0;
        }
    }

    function _calcMint(uint256 amountIn) internal view returns (uint256) {
        uint256 price = IgAVAX(gavax).pricePerShare(pooledTknId);
        return (amountIn * gAVAX_DENOMINATOR) / price;
    }

    function _swap(
        uint256 _amountIn,
        uint256 _amountOut,
        address _tokenIn,
        address _tokenOut,
        address _to
    ) internal override {
        if (_tokenIn == WAVAX) {
            IWETH(WAVAX).withdraw(_amountIn);
            if (_stakingPaused()) {
                _swapUnderlying(0, 1, _amountIn, _amountOut, _amountIn);
            } else {
                _geodeStake(_amountIn, _amountOut);
            }
        } else {
            _swapUnderlying(1, 0, _amountIn, _amountOut, 0);
            IWETH(WAVAX).deposit{ value: address(this).balance }();
        }
        uint256 balThis = IERC20(_tokenOut).balanceOf(address(this));
        require(balThis >= _amountOut, "Insufficient amount out");
        _returnTo(_tokenOut, balThis, _to);
    }

    function _swapUnderlying(
        uint8 _tokenInIndex,
        uint8 _tokenOutIndex,
        uint256 _amountIn,
        uint256 _amountOut,
        uint256 _val
    ) internal {
        IGeodeWP(pool).swap{ value: _val }(_tokenInIndex, _tokenOutIndex, _amountIn, _amountOut, block.timestamp);
    }

    function _geodeStake(uint256 _amountIn, uint256 _amountOut) internal {
        IGeodePortal(portal).stake{ value: _amountIn }(pooledTknId, _amountOut, block.timestamp);
    }
}
