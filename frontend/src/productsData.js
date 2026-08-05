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
  { _id: "prod_1", id: "prod_1", name: "Air Max Pro Runner", price: 4999, image: imageArray[0], category: "Running Sneakers", sizes: ["7", "8", "9", "10", "11", "12"], reviews: [{ user: "John Doe", rating: 5, comment: "Great shoes for running!" }, { user: "Jane Smith", rating: 4, comment: "Comfortable and stylish." }] },
  { _id: "prod_2", id: "prod_2", name: "Classic White Sneakers", price: 1499, image: imageArray[1], category: "Casual Sneakers", sizes: ["6", "7", "8", "9", "10", "11"], reviews: [{ user: "Alice", rating: 5, comment: "Perfect for everyday wear." }] },
  { _id: "prod_3", id: "prod_3", name: "Performance Runner", price: 3999, image: imageArray[2], category: "Running Sneakers", sizes: ["8", "9", "10", "11", "12"], reviews: [{ user: "Bob", rating: 4, comment: "Very fast and responsive." }] },
  { _id: "prod_4", id: "prod_4", name: "Athletic Performance", price: 5499, image: imageArray[4], category: "Running Sneakers", sizes: ["7", "8", "9", "10", "11", "12"], reviews: [{ user: "Diana", rating: 4, comment: "Good for sports activities." }] },
  { _id: "prod_5", id: "prod_5", name: "Urban Casual", price: 1299, image: imageArray[5], category: "Casual Sneakers", sizes: ["6", "7", "8", "9", "10"], reviews: [{ user: "Eve", rating: 5, comment: "Light and comfortable." }] },
  { _id: "prod_6", id: "prod_6", name: "Comfort Walk", price: 1599, image: imageArray[7], category: "Casual Sneakers", sizes: ["7", "8", "9", "10", "11", "12"], reviews: [{ user: "Grace", rating: 5, comment: "Super comfortable." }] },
  { _id: "prod_7", id: "prod_7", name: "Elite Runner", price: 2999, image: imageArray[8], category: "Running Sneakers", sizes: ["8", "9", "10", "11", "12"], reviews: [{ user: "Henry", rating: 4, comment: "Great for long runs." }] },
  { _id: "prod_8", id: "prod_8", name: "Street Canvas", price: 1999, image: imageArray[10], category: "Casual Sneakers", sizes: ["6", "7", "8", "9", "10", "11"], reviews: [{ user: "Jack", rating: 4, comment: "Retro style and comfortable." }] },
  { _id: "prod_9", id: "prod_9", name: "Classic Analog Watch", price: 2499, image: imageArray[0], category: "Watches", sizes: [], reviews: [{ user: "Mike", rating: 5, comment: "Elegant and timeless." }] },
  { _id: "prod_10", id: "prod_10", name: "Smart Watch Pro", price: 5999, image: imageArray[2], category: "Watches", sizes: [], reviews: [{ user: "Sara", rating: 4, comment: "Great features and battery life." }] },
  { _id: "prod_11", id: "prod_11", name: "Leather Dress Belt", price: 899, image: imageArray[4], category: "Belts", sizes: ["32", "34", "36", "38", "40", "42", "44"], reviews: [{ user: "Tom", rating: 5, comment: "Premium quality leather." }] },
  { _id: "prod_12", id: "prod_12", name: "Casual Canvas Belt", price: 499, image: imageArray[6], category: "Belts", sizes: ["32", "34", "36", "38", "40"], reviews: [{ user: "Amy", rating: 4, comment: "Perfect for casual wear." }] },
  { _id: "prod_13", id: "prod_13", name: "Sport Digital Watch", price: 1999, image: imageArray[8], category: "Watches", sizes: [], reviews: [{ user: "Chris", rating: 5, comment: "Perfect for workouts." }] },
  { _id: "prod_14", id: "prod_14", name: "Designer Belt", price: 1299, image: imageArray[10], category: "Belts", sizes: ["32", "34", "36", "38", "40", "42"], reviews: [{ user: "Lisa", rating: 4, comment: "Stylish and durable." }] },
];
