      {isModalOpen && (
        <div className="w-full h-full flex items-center justify-center absolute top-0 right-0 bg-black bg-opacity-30">
          <div className="w-[300px] sm:w-[500px] md:w-[400px] flex flex-col p-3 items-center justify-center bg-white rounded-lg">
            <div className="w-16 h-16">
              <Image
                className="w-full h-full cursor-pointer object-cover rounded-full"
                width={100}
                height={100}
                src={photo !== undefined ? photo : "/avatars/userprofile.png"}
                alt=""
              />
            </div>
            <ul className="w-full text-center mt-3">
              <li className="border-t py-2 hover:bg-gray-100 border-gray-300 font-medium text-gray-800 cursor-pointer w-full">
                Take Photo
              </li>
              <li className="border-t py-2 hover:bg-gray-100 border-gray-300 font-medium text-gray-800 cursor-pointer w-full">
                Choose from library
              </li>
              <li
                onClick={() => handleUploadPhotoBtn()}
                className="border-t py-2 hover:bg-gray-100 border-gray-300 font-medium text-sky-500 cursor-pointer w-full"
              >
                Upload Photo
              </li>
              <li className="border-t py-2 hover:bg-gray-100 border-gray-300 font-medium text-red-600 cursor-pointer w-full">
                Remove Current Photo
              </li>
              <li
                onClick={() => setModalOpen(false)}
                className="border-t py-2 hover:bg-gray-100 border-gray-300 font-medium text-gray-800 cursor-pointer w-full"
              >
                Cancel
              </li>
            </ul>
          </div>
        </div>
      )}
