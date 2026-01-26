'use client'
import Map from "@/components/MyListing/GoogleMap"
import { t } from "@/utils"
import { IoLocationOutline } from "react-icons/io5"


const LocationCardInProdDet = ({ productData }) => {


    const handleShowMapClick = () => {
        const locationParts = [];
        if (productData?.city) locationParts.push(productData.city);
        // Only add state if it's different from city
        if (productData?.state && productData.state !== productData?.city) {
            locationParts.push(productData.state);
        }
        if (productData?.country) locationParts.push(productData.country);
        const locationQuery = locationParts.join(", ");
        const googleMapsUrl = `https://www.google.com/maps?q=${locationQuery}&ll=${productData?.latitude},${productData?.longitude}&z=12&t=m`;
        window.open(googleMapsUrl, '_blank');
    };


    return (
        <div className="posted_in_card card">
            <div className="card-header">
                <span>{t('postedIn')}</span>
            </div>
            <div className="card-body">
                <div className="location">
                    <span><IoLocationOutline size={24} /></span>
                    <span>
                        {(() => {
                            const locationParts = [];
                            if (productData?.city) locationParts.push(productData.city);
                            // Only add state if it's different from city
                            if (productData?.state && productData.state !== productData?.city) {
                                locationParts.push(productData.state);
                            }
                            if (productData?.country) locationParts.push(productData.country);
                            return locationParts.join(", ");
                        })()}
                    </span>
                </div>
                <div className="location_details_map">
                    <Map latitude={productData?.latitude} longitude={productData?.longitude} />
                </div>
                <div className="show_full_map">
                    <button onClick={handleShowMapClick}>{t('showOnMap')}</button>
                </div>
            </div>
        </div>
    )
}

export default LocationCardInProdDet