"use client";
import axios from "axios";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import { firebaseAuth } from "@/utils/FirebaseConfig";

import { useStateProvider } from "@/context/StateContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { reducerCases } from "@/context/constants";
import { GET_USER_ROUTE } from "@/utils/ApiRoutes";

export function Tab() {
  return <></>;
}
