import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyBhuHoQQJ_gyfw6Ap32mNJcE5WZnNcaHtg",
  authDomain: "eduroclass.firebaseapp.com",
  projectId: "eduroclass",
  storageBucket: "eduroclass.appspot.com",
  messagingSenderId: "699096402833",
  appId: "1:699096402833:web:c0bc59a7381f602465a830",
  measurementId: "G-CB2S69VLL5",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
