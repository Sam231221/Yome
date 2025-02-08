// "use client";

// import { ReactNode, useEffect, useState } from "react";
// //used to interact with the Stream Video API.
// import { StreamVideoClient, StreamVideo } from "@stream-io/video-react-sdk";
// import { useUser } from "@clerk/nextjs";

// import { tokenProvider } from "@/actions/stream.actions";
// import Loader from "@/components/Loader";

// const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

// const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
//   const [videoClient, setVideoClient] = useState<StreamVideoClient>();
//   const { user, isLoaded } = useUser();

//   useEffect(() => {
//     if (!isLoaded || !user) return;
//     if (!API_KEY) throw new Error("Stream API key is missing");

//     // Initialize the Stream Video client
//     const client = new StreamVideoClient({
//       apiKey: API_KEY,
//       // Set the user details
//       user: {
//         id: user?.id,
//         name: user?.username || user?.id,
//         image: user?.imageUrl,
//       },
//       // function send to this that generates a token for authenticating with the Stream Video API.
//       tokenProvider,
//     });

//     setVideoClient(client);
//   }, [user, isLoaded]);

//   if (!videoClient) return <Loader />;

//   return <StreamVideo client={videoClient}>{children}</StreamVideo>;
// };

// export default StreamVideoProvider;
// //Once the videoClient is initialized, the component wraps its children with the StreamVideo provider, passing the videoClient as a prop. This makes the video client available to all child components.
