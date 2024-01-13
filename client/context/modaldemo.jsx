<div className="flex flex-col sm:flex-row mb-2 bg-gray-100 py-4 px-3 rounded-lg justify-between items-center">
  <div className="flex relative gap-2 p">
    <label htmlFor="profilePhoto">
      <input
        accept="image/*"
        id="profilePhoto"
        type="file"
        style={{ display: "none" }}
        onChange={handleChange}
      />
      <div className="w-10 h-10 rounded-full">
        <Image
          className="w-full h-full cursor-pointer rounded-full"
          width={100}
          height={100}
          src="/images/banner.png"
          alt=""
        />
      </div>
    </label>
    {file && (
      <IoMdCrop
        className="text-blue-400"
        size={20}
        onClick={() => setOpenCrop(true)}
      />
    )}
    <div className="flex flex-col">
      <h1 className="text-sm font-semibold text-gray-800">sameershai123</h1>
      <p className="text-xs text-gray-400">Sameer Shahi</p>
    </div>
  </div>
  <div>
    <button className="bg-sky-500 text-sm rounded-lg px-3 py-2 text-white  ">
      Change photo
    </button>
  </div>
</div>;
