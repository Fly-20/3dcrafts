export type Testimonial = {
  name: string;
  rating: number;
  date: string;
  text: string;
  item: string;
  price?: string;
};

// Real Etsy reviews, newest first. In production the section is hidden if this list is empty;
// the samples below only show in local development.
export const realTestimonials: Testimonial[] = [
  { name: "Nadine", rating: 5, date: "20 Oct 2026", text: "Great serviceade exactly what I needed. Thank you", item: "Custom 3D print from STL" },
  { name: "Ste", rating: 5, date: "13 Oct 2026", text: "Good product arrived well on time securely packaged. Thanks", item: "Personalised wooden greeting card" },
  { name: "Nick", rating: 5, date: "29 Sept 2026", text: "Quick responses, good product quality, fast delivery.", item: "Custom 3D print from STL" },
  { name: "Paul", rating: 5, date: "27 Sept 2026", text: "Great service. Very helpful. Understood my requirement and delivered quickly highly recommended", item: "Custom 3D print from STL" },
  { name: "Tess", rating: 5, date: "21 Sept 2026", text: "Love the card, will order again", item: "Personalised birthday wooden card" },
  { name: "Gary", rating: 5, date: "18 Sept 2026", text: "Item was millimetre perfect 🤩 Highly recommended", item: "Custom 3D print from STL" },
  { name: "Karen", rating: 5, date: "13 Sept 2026", text: "Seller kept me informed on delivery. Item is lovely and well liked by recipient. This is my second purchase. Thanks", item: "Engraved wood anniversary card" },
  { name: "Kim", rating: 5, date: "11 Sept 2026", text: "Beautiful item which is exactly what I needed.", item: "Personalised birthday wooden card" },
  { name: "amy", rating: 5, date: "10 Sept 2026", text: "Amazing! The seller created something for me that I asked for and sent it next day delivery and it arrived on time ( a date earlier than planned) I really love the product it’s so lovely and just perfect Thanks so much Highly recommend!!!! X", item: "Valentine’s Day wooden card" },
  { name: "lorna", rating: 5, date: "09 Sept 2026", text: "absolutely stunning thankyou a real piece of art recommend this shop", item: "Personalised birthday wooden card" },
  { name: "Steve", rating: 5, date: "16 Aug 2026", text: "Beautifully crafted wedding anniversary card was made and dispatched quickly. Arrived in perfect condition, my wife is going to love it. It looks exactly like the pictures and is a beautiful, tactile gift. Very happy, thank you.", item: "Engraved wood anniversary card" },
  { name: "Claire", rating: 5, date: "06 Jul 2026", text: "Such a beautiful card they delivered it so fast, can see the time and effort that sent into the card thank so much", item: "Personalised birthday wooden card" },
  { name: "JoanK", rating: 5, date: "29 Jun 2026", text: "Excellent and beautiful product much better than described. Well packaged and efficient delivery. Happy to recommend.", item: "Personalised birthday wooden card" },
  { name: "Maureen", rating: 5, date: "21 Jun 2026", text: "My friend was delighted with this card thought it was great to keep.", item: "Personalised birthday wooden card" },
  { name: "Ros", rating: 5, date: "08 May 2026", text: "As advertised on site well received", item: "Valentine’s Day wooden card" },
  { name: "Karolina", rating: 5, date: "01 May 2026", text: "Very good quality - my partner loved it.", item: "Wooden hearts gift set" },
  { name: "Lynda", rating: 5, date: "20 Apr 2026", text: "Beautiful card and a wonderful keepsake for my husband’s 80th birthday. Thank you so much,", item: "Personalised birthday wooden card" },
  { name: "Nick", rating: 5, date: "01 Apr 2026", text: "Excellent card for my spouse.", item: "Valentine’s Day wooden card" },
  { name: "Sharron", rating: 5, date: "28 Mar 2026", text: "Father in law loved it", item: "Personalised birthday wooden card" },
  { name: "Sandra", rating: 5, date: "27 Mar 2026", text: "Beautiful wooden cards this time for my cousin's 70th Birthday, Umang was so helpful with the wording and that the verse will fit perfectly inside card, I will definitely purchase again for special occasions, highly recommend you will not be disappointed", item: "Personalised wooden card" },
];

const sampleTestimonials: Testimonial[] = [
  { name: "Sample A.", rating: 5, date: "2 weeks ago", text: "SAMPLE TEXT — replace with a real Etsy review. Short, specific reviews work best on these cards.", item: "Custom cake topper", price: "£00.00" },
  { name: "Sample B.", rating: 5, date: "a month ago", text: "SAMPLE TEXT — replace with a real Etsy review. Mention what was made and how it turned out.", item: "Replacement bracket", price: "£00.00" },
  { name: "Sample C.", rating: 5, date: "3 weeks ago", text: "SAMPLE TEXT — replace with a real Etsy review about the design help, speed or quality.", item: "Laser-cut sign", price: "£00.00" },
  { name: "Sample D.", rating: 4, date: "5 days ago", text: "SAMPLE TEXT — replace with a real Etsy review. Honest four-star reviews build trust too.", item: "Table numbers", price: "£00.00" },
  { name: "Sample E.", rating: 5, date: "2 months ago", text: "SAMPLE TEXT — replace with a real Etsy review from a repeat customer or business.", item: "Keyrings (batch)", price: "£00.00" },
  { name: "Sample F.", rating: 5, date: "a week ago", text: "SAMPLE TEXT — replace with a real Etsy review. Two or three sentences is plenty.", item: "Prototype enclosure", price: "£00.00" },
];

export const testimonials = realTestimonials.length ? realTestimonials : process.env.NODE_ENV === "production" ? [] : sampleTestimonials;
