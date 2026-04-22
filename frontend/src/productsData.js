import SHOE1 from "./images/SHOE1.jpg";
import WhatsApp1 from "./images/WhatsApp Image 2026-01-13 at 7.57.38 PM.jpeg";
import WhatsApp2 from "./images/WhatsApp Image 2026-01-13 at 7.57.39 PM (1).jpeg";
import WhatsApp3 from "./images/WhatsApp Image 2026-01-13 at 7.57.39 PM.jpeg";
import WhatsApp4 from "./images/WhatsApp Image 2026-01-13 at 7.57.40 PM.jpeg";
import Screenshot1 from "./images/Screenshot 2026-02-04 122545.png";
import Screenshot2 from "./images/Screenshot 2026-02-04 122832.png";
import Screenshot3 from "./images/Screenshot 2026-02-04 122857.png";
import Screenshot4 from "./images/Screenshot 2026-02-04 123044.png";
import Screenshot5 from "./images/Screenshot 2026-02-04 123126.png";
import Screenshot6 from "./images/Screenshot 2026-02-04 123222.png";
import Screenshot7 from "./images/Screenshot 2026-02-04 123246.png";

const imageArray = [
  SHOE1,
  WhatsApp1,
  WhatsApp2,
  WhatsApp3,
  WhatsApp4,
  Screenshot1,
  Screenshot2,
  Screenshot3,
  Screenshot4,
  Screenshot5,
  Screenshot6,
  Screenshot7
];

export const productsData = [
  { id: 1, name: "Air Max Pro Runner", price: 4999, image: imageArray[0], category: "Running Sneakers", reviews: [{ user: "John Doe", rating: 5, comment: "Great shoes for running!" }, { user: "Jane Smith", rating: 4, comment: "Comfortable and stylish." }] },
  { id: 2, name: "Classic White Sneakers", price: 1499, image: imageArray[1], category: "Casual Sneakers", reviews: [{ user: "Alice", rating: 5, comment: "Perfect for everyday wear." }] },
  { id: 3, name: "Performance Runner", price: 3999, image: imageArray[2], category: "Running Sneakers", reviews: [{ user: "Bob", rating: 4, comment: "Very fast and responsive." }] },
  { id: 5, name: "Athletic Performance", price: 5499, image: imageArray[4], category: "Running Sneakers", reviews: [{ user: "Diana", rating: 4, comment: "Good for sports activities." }] },
  { id: 6, name: "Urban Casual", price: 1299, image: imageArray[5], category: "Casual Sneakers", reviews: [{ user: "Eve", rating: 5, comment: "Light and comfortable." }] },
  { id: 8, name: "Comfort Walk", price: 1599, image: imageArray[7], category: "Casual Sneakers", reviews: [{ user: "Grace", rating: 5, comment: "Super comfortable." }] },
  { id: 9, name: "Elite Runner", price: 2999, image: imageArray[8], category: "Running Sneakers", reviews: [{ user: "Henry", rating: 4, comment: "Great for long runs." }] },
  { id: 11, name: "Street Canvas", price: 1999, image: imageArray[10], category: "Casual Sneakers", reviews: [{ user: "Jack", rating: 4, comment: "Retro style and comfortable." }] },
  { id: 13, name: "Classic Analog Watch", price: 2499, image: imageArray[0], category: "Watches", reviews: [{ user: "Mike", rating: 5, comment: "Elegant and timeless." }] },
  { id: 14, name: "Smart Watch Pro", price: 5999, image: imageArray[2], category: "Watches", reviews: [{ user: "Sara", rating: 4, comment: "Great features and battery life." }] },
  { id: 15, name: "Leather Dress Belt", price: 899, image: imageArray[4], category: "Belts", reviews: [{ user: "Tom", rating: 5, comment: "Premium quality leather." }] },
  { id: 16, name: "Casual Canvas Belt", price: 499, image: imageArray[6], category: "Belts", reviews: [{ user: "Amy", rating: 4, comment: "Perfect for casual wear." }] },
  { id: 17, name: "Sport Digital Watch", price: 1999, image: imageArray[8], category: "Watches", reviews: [{ user: "Chris", rating: 5, comment: "Perfect for workouts." }] },
  { id: 18, name: "Designer Belt", price: 1299, image: imageArray[10], category: "Belts", reviews: [{ user: "Lisa", rating: 4, comment: "Stylish and durable." }] },
];
