// Ensure you have VITE_RAPIDAPI_KEY set in your .env file
export const getHotelsFromRapidAPI = async (
  destination: string,
  checkIn: string,
  checkOut: string,
  guests: number
) => {
  const apiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  
  if (!apiKey) {
    throw new Error('RapidAPI key is missing! Please add VITE_RAPIDAPI_KEY to your .env file.');
  }

  try {
    // 1. Get Region ID (gaiaId) using v2/regions
    const regUrl = new URL('https://hotels-com-provider.p.rapidapi.com/v2/regions');
    regUrl.searchParams.append('query', destination);
    regUrl.searchParams.append('locale', 'en_US');
    regUrl.searchParams.append('domain', 'US');

    const regResponse = await fetch(regUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'hotels-com-provider.p.rapidapi.com'
      }
    });

    if (!regResponse.ok) {
      throw new Error(`Region fetch failed: ${regResponse.status}`);
    }

    const regData = await regResponse.json();

    if (!regData.data || regData.data.length === 0) {
      throw new Error('Destination not found.');
    }

    const searchableRegion = regData.data.find((r: any) => r.type === 'CITY' || r.type === 'NEIGHBORHOOD') || regData.data[0];
    const regionId = searchableRegion.gaiaId;

    if (!regionId) {
      throw new Error('Could not determine region ID.');
    }

    // 2. Search Hotels with the Region ID using v3/hotels/search
    const searchUrl = new URL('https://hotels-com-provider.p.rapidapi.com/v3/hotels/search');
    searchUrl.searchParams.append('region_id', regionId);
    searchUrl.searchParams.append('locale', 'en_US');
    searchUrl.searchParams.append('checkin_date', checkIn);
    searchUrl.searchParams.append('checkout_date', checkOut);
    searchUrl.searchParams.append('adults_number', guests.toString());
    searchUrl.searchParams.append('domain', 'US');
    searchUrl.searchParams.append('sort_order', 'RECOMMENDED');
    
    let searchResponse = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'hotels-com-provider.p.rapidapi.com'
      }
    });
    
    if (!searchResponse.ok) {
      if (searchResponse.status === 422 || searchResponse.status === 424) {
        const errBody = await searchResponse.json().catch(() => ({}));
        console.error("v3 Search Validation Error Details:", JSON.stringify(errBody, null, 2));
      }
      
      // Fallback logic for v2 if v3 fails
      console.warn(`v3 search failed (${searchResponse.status}), trying v2/hotels/search fallback...`);
      const v2Url = new URL('https://hotels-com-provider.p.rapidapi.com/v2/hotels/search');
      // v2 in this provider now uses similar parameters to v3
      v2Url.searchParams.append('region_id', regionId);
      v2Url.searchParams.append('locale', 'en_US');
      v2Url.searchParams.append('checkin_date', checkIn);
      v2Url.searchParams.append('checkout_date', checkOut);
      v2Url.searchParams.append('adults_number', guests.toString());
      v2Url.searchParams.append('domain', 'US');
      v2Url.searchParams.append('sort_order', 'RECOMMENDED');
      
      searchResponse = await fetch(v2Url.toString(), {
        method: 'GET',
        headers: {
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': 'hotels-com-provider.p.rapidapi.com'
        }
      });

      if (!searchResponse.ok && (searchResponse.status === 422 || searchResponse.status === 424)) {
        const errBody = await searchResponse.json().catch(() => ({}));
        console.error("v2 Search Validation Error Details:", JSON.stringify(errBody, null, 2));
      }
    }

    if (!searchResponse.ok) {
      throw new Error(`Hotel search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const results = searchData.data?.properties || searchData.data?.body?.searchResults?.results || [];

    if (!results || results.length === 0) {
      return [];
    }

    // 3. Transform the response to match the ZenTravel schema
    return results.map((h: any, index: number) => {
      // Handle v3 (properties) or v2 (searchResults) price structures
      const priceStr = h.price?.priceSummary?.displayPrices?.[0]?.value || 
                       h.ratePlan?.price?.current || 
                       h.optimizedPrice?.displayPrice || "";
      // Extract numeric value (e.g., "$151 nightly" -> 151)
      const match = priceStr.match(/([0-9,.]+)/);
      const usdPrice = match ? parseFloat(match[1].replace(/,/g, '')) : 0;
      const myrPrice = Math.round(usdPrice * 4.7);
      const formattedPrice = myrPrice > 0 ? `MYR ${myrPrice}` : "Contact for price";
      
      return {
        name: h.name,
        location: h.neighborhood?.name || h.address?.locality || destination,
        price: formattedPrice,
        rating: h.guestRating?.rating ? h.guestRating.rating.toString() : 
                h.guestReviews?.rating ? h.guestReviews.rating.toString() : 
                h.starRating ? h.starRating.toString() : "N/A",
        description: h.starRating ? `${h.starRating} star property with great amenities.` : 'Comfortable stay in a prime location.',
        amenities: h.short_amenities || h.amenities?.map((a:any) => a.description) || ["Free WiFi", "Air Conditioning", "Housekeeping"],
        imageUrl: h.mediaSection?.media?.[0]?.url || h.optimizedThumbUrls?.srpDesktop || h.thumbnailUrl || "",
        image_keyword: destination, // fallback
        isRecommended: index === 0
      };
    });
  } catch (error) {
    console.error("RapidAPI Error:", error);
    throw error;
  }
};
