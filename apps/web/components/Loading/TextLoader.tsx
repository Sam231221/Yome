import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const TextLoader = ({ classname }) => {
  return (
    <SkeletonTheme baseColor="#d4d4d4" highlightColor="#9c9c9c">
      <div className={classname}>
        <div className="flex items-center relative gap-6">
          <Skeleton
            count={1}
            style={{
              width: "100px",
              height: "15px",
            }}
          />
        </div>
      </div>
    </SkeletonTheme>
  );
};
export default TextLoader;
