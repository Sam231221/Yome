export function generateUsername(firstName, lastName) {
 // Choose either firstName or lastName randomly
 const namePart = Math.random() < 0.5 ? firstName : lastName;

 // Generate three random digits
 const randomDigits = Math.floor(Math.random() * 900) + 100; // Ensures a 3-digit number

 // Combine parts to create the username
 const username = namePart.toLowerCase() + "@" + randomDigits;

 return username;
}