function Loader() {
  return (
    <div
      className="col-sm-12 col-md-12 mt-0 col-lg-12 flex h-[80vh]"
      style={{ backgroundColor: "var(--primaryBgColor)" }}
    >
      <div
        role="status"
        aria-label="Loading..."
        className="m-auto h-12 w-12 animate-spin rounded-full border-[3px] border-[var(--primaryTextColor)] border-t-transparent"
      />
    </div>
  );
}
export default Loader;
