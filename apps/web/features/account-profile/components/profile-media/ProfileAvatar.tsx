import { IoMdCrop } from "react-icons/io";
import CropEasy from "./CropEasy";
import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import Image from "next/image";
import { useAuthState } from "@/features/auth/providers/AuthStateProvider";

type ProfileAvatarProps = {
  pic: string;
  setPic: Dispatch<SetStateAction<File | null>>;
};

const ProfileAvatar = ({ pic, setPic }: ProfileAvatarProps) => {
  const [{ userInfo }] = useAuthState();
  const [photo, setPhoto] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [openCrop, setOpenCrop] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0] ?? null;

    if (nextFile) {
      setFile(nextFile);
      setPic(nextFile);
      setPhoto(URL.createObjectURL(nextFile));
      setOpenCrop(true);
    }
  };

  useEffect(() => {
    setPhoto(pic);
  }, [pic]);

  return (
    <div className="">
      {!openCrop ? (
        <div className="flex flex-col sm:flex-row mb-2 bg-gray-100 py-4 px-3 rounded-lg justify-between items-center">
          <div className="flex gap-3 items-center">
            <div className="flex flex-col">
              <label htmlFor="profilePhoto">
                <input
                  accept="image/*"
                  id="profilePhoto"
                  type="file"
                  name="avatar"
                  style={{ display: "none" }}
                  onChange={handleChange}
                />
                <div className="w-16 h-16 rounded-full">
                  <Image
                    className="w-full h-full cursor-pointer object-cover rounded-full"
                    width={100}
                    height={100}
                    src={photo || "/avatars/userprofile.png"}
                    alt=""
                  />
                </div>
              </label>
              {file && (
                <IoMdCrop
                  className="text-blue-600"
                  size={20}
                  onClick={() => setOpenCrop(true)}
                />
              )}
            </div>

            <div className="flex flex-col">
              <h1 className="text-sm font-semibold text-gray-800">
                {userInfo?.username}
              </h1>
              <p className="text-xs text-gray-400">{userInfo?.name}</p>
            </div>
          </div>
          <div>
            <button
              onClick={() => {
                setFile(null);
                setPic(null);
                setPhoto("/avatars/userprofile.png");
                setOpenCrop(false);
              }}
              className="bg-red-500 text-sm rounded-lg px-3 py-2 text-white  "
            >
              Remove photo
            </button>
          </div>
        </div>
      ) : (
        <CropEasy {...{ photo, setOpenCrop, setPhoto, setFile }} />
      )}
    </div>
  );
};

export default ProfileAvatar;
