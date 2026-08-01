// Auto pincode lookup for City, State, and Country
export async function lookupPincode(pincode) {
  const cleanPin = String(pincode || "").replace(/\D/g, "");
  if (cleanPin.length !== 6) return null;

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    const data = await res.json();
    if (Array.isArray(data) && data[0]?.Status === "Success" && data[0]?.PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        city: po.District || po.Block || po.Name || "",
        state: po.State || "",
        country: "India"
      };
    }
  } catch (e) {
    console.error("Pincode lookup error:", e);
  }
  return null;
}
