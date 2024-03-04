import { Spinner } from "react-bootstrap";
function Loader() {
  return (
    <div
      className="col-sm-12 col-md-12 mt-0 col-lg-12"
      style={{
        height: "80vh",
        display: "flex",
        backgroundColor: "var(--primaryBgColor)",
      }}
    >
      <Spinner
        animation="border"
        role="status"
        style={{
          height: "48px",
          width: "48px",
          margin: "auto",
          display: "block",
          color: "var(--primaryTextColor)",
        }}
      >
        <span className="sr-only">Loading...</span>
      </Spinner>
    </div>
  );
}
export default Loader;
