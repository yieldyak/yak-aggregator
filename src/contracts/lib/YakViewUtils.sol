// SPDX-License-Identifier: GPL-3.0-only
pragma solidity >=0.8.4;

import { Offer, FormattedOffer } from "../interface/IYakRouter.sol";
import "./TypeConversion.sol";


library OfferUtils {
    using TypeConversion for address;
    using TypeConversion for uint256;
    using TypeConversion for bytes;

    function newOffer(
        uint _amountIn,
        address _tokenIn
    ) internal pure returns (Offer memory offer) {
        offer.amounts = _amountIn.toBytes();
        offer.path = _tokenIn.toBytes();
    }

    /**
     * Makes a deep copy of Offer struct
     */
    function clone(Offer memory _queries) internal pure returns (Offer memory) {
        return Offer(_queries.amounts, _queries.adapters, _queries.path, _queries.gasEstimate);
    }

    /**
     * Appends new elements to the end of Offer struct
     */
    function addToTail(
        Offer memory _queries,
        uint256 _amount,
        address _adapter,
        address _tokenOut,
        uint256 _gasEstimate
    ) internal pure {
        _queries.path = bytes.concat(_queries.path, _tokenOut.toBytes());
        _queries.adapters = bytes.concat(_queries.adapters, _adapter.toBytes());
        _queries.amounts = bytes.concat(_queries.amounts, _amount.toBytes());
        _queries.gasEstimate += _gasEstimate;
    }

    /**
     * Formats elements in the Offer object from byte-arrays to integers and addresses
     */
    function format(Offer memory _queries) internal pure returns (FormattedOffer memory) {
        return
            FormattedOffer(
                _queries.amounts.toUints(),
                _queries.adapters.toAddresses(),
                _queries.path.toAddresses(),
                _queries.gasEstimate
            );
    }

    function getTokenOut(
        Offer memory _offer
    ) internal pure returns (address tokenOut) {
        tokenOut = _offer.path.toAddress(_offer.path.length);  // Last 32 bytes
    }

    function getAmountOut(
        Offer memory _offer
    ) internal pure returns (uint amountOut) {
        amountOut = _offer.amounts.toUint(_offer.path.length);  // Last 32 bytes
    }

}

library FormattedOfferUtils {
    using TypeConversion for address;
    using TypeConversion for uint256;
    using TypeConversion for bytes;

    /**
     * Appends new elements to the end of FormattedOffer
     */
    function addToTail(
        FormattedOffer memory offer, 
        uint256 amountOut, 
        address wrapper,
        address tokenOut,
        uint256 gasEstimate
    ) internal pure {
        offer.amounts = bytes.concat(abi.encodePacked(offer.amounts), amountOut.toBytes()).toUints();
        offer.adapters = bytes.concat(abi.encodePacked(offer.adapters), wrapper.toBytes()).toAddresses();
        offer.path = bytes.concat(abi.encodePacked(offer.path), tokenOut.toBytes()).toAddresses();
        offer.gasEstimate += gasEstimate;
    }

    /**
     * Appends new elements to the beginning of FormattedOffer
     */
    function addToHead(
        FormattedOffer memory offer, 
        uint256 amountOut, 
        address wrapper,
        address tokenOut,
        uint256 gasEstimate
    ) internal pure {
        offer.amounts = bytes.concat(amountOut.toBytes(), abi.encodePacked(offer.amounts)).toUints();
        offer.adapters = bytes.concat(wrapper.toBytes(), abi.encodePacked(offer.adapters)).toAddresses();
        offer.path = bytes.concat(tokenOut.toBytes(), abi.encodePacked(offer.path)).toAddresses();
        offer.gasEstimate += gasEstimate;
    }

    function getAmountOut(FormattedOffer memory offer) internal pure returns (uint256) {
        return offer.amounts[offer.amounts.length - 1];
    }

}