// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract EnergyMarketplace {
    struct Offer {
        uint256 id;
        address seller;
        uint256 unitsMilliKwh;
        uint256 remainingMilliKwh;
        uint256 pricePerKwhWei;
        bool active;
    }

    uint256 public offerCount;
    mapping(uint256 => Offer) public offers;

    event OfferListed(
        uint256 indexed offerId,
        address indexed seller,
        uint256 unitsMilliKwh,
        uint256 pricePerKwhWei
    );
    event OfferPurchased(
        uint256 indexed offerId,
        address indexed buyer,
        uint256 unitsMilliKwh,
        uint256 totalPaidWei
    );
    event OfferCancelled(uint256 indexed offerId, address indexed seller);

    function listOffer(uint256 unitsMilliKwh, uint256 pricePerKwhWei) external returns (uint256) {
        require(unitsMilliKwh > 0, "units=0");
        require(pricePerKwhWei > 0, "price=0");

        offerCount += 1;
        offers[offerCount] = Offer({
            id: offerCount,
            seller: msg.sender,
            unitsMilliKwh: unitsMilliKwh,
            remainingMilliKwh: unitsMilliKwh,
            pricePerKwhWei: pricePerKwhWei,
            active: true
        });

        emit OfferListed(offerCount, msg.sender, unitsMilliKwh, pricePerKwhWei);
        return offerCount;
    }

    function buyOffer(uint256 offerId, uint256 unitsMilliKwh) external payable {
        Offer storage offer = offers[offerId];
        require(offer.active, "inactive");
        require(unitsMilliKwh > 0, "units=0");
        require(unitsMilliKwh <= offer.remainingMilliKwh, "insufficient-units");

        uint256 costWei = (unitsMilliKwh * offer.pricePerKwhWei) / 1000;
        require(msg.value >= costWei, "insufficient-value");

        offer.remainingMilliKwh -= unitsMilliKwh;
        if (offer.remainingMilliKwh == 0) {
            offer.active = false;
        }

        (bool paid, ) = payable(offer.seller).call{value: costWei}("");
        require(paid, "seller-payment-failed");

        if (msg.value > costWei) {
            (bool refunded, ) = payable(msg.sender).call{value: msg.value - costWei}("");
            require(refunded, "refund-failed");
        }

        emit OfferPurchased(offerId, msg.sender, unitsMilliKwh, costWei);
    }

    function cancelOffer(uint256 offerId) external {
        Offer storage offer = offers[offerId];
        require(offer.active, "inactive");
        require(offer.seller == msg.sender, "not-seller");
        offer.active = false;
        emit OfferCancelled(offerId, msg.sender);
    }

    function getActiveOffers() external view returns (Offer[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 1; i <= offerCount; i++) {
            if (offers[i].active) {
                activeCount++;
            }
        }

        Offer[] memory result = new Offer[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= offerCount; i++) {
            if (offers[i].active) {
                result[index] = offers[i];
                index++;
            }
        }
        return result;
    }
}
