import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export const InstitutionSkeleton = ({ cards, counts, classname }) => {
  return Array(cards)
    .fill(0)
    .map((item, i) => (
      <div key={i} className={classname}>
        <div className="card">
          <div className="d-flex justify-content-center align-items-center p-2">
            <div className="container notice-div">
              <Skeleton
                count={1}
                style={{
                  height: "160px",
                  marginBottom: "10px",
                }}
              />

              <Skeleton
                count={1}
                style={{
                  width: "200px",
                  height: "12px",
                }}
              />
              <Skeleton
                count={1}
                style={{
                  width: "100%",
                  height: "10px",
                }}
              />
              <Skeleton
                count={1}
                style={{
                  width: "100%",
                  height: "8px",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    ));
};

export const CommunitySkeleton = ({ cards, classname }) => {
  return Array(cards)
    .fill(0)
    .map((item, i) => (
      <div key={i} className={classname}>
        <div className="card">
          <div className="flex justify-content-center align-items-center p-2">
            <div className="container notice-div">
              <Skeleton
                count={1}
                style={{
                  height: "244px",
                  marginBottom: "10px",
                }}
              />
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <Skeleton
                    count={1}
                    style={{
                      width: "100px",
                      height: "20px",
                      marginBottom: "5px",
                    }}
                  />
                  <Skeleton
                    count={1}
                    style={{
                      width: "100px",
                      height: "20px",
                      marginBottom: "5px",
                    }}
                  />
                </div>
                <Skeleton
                  count={1}
                  style={{
                    width: "100px",
                    height: "50px",
                    marginBottom: "5px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
};

export const MentorSkeleton = ({ cards, classname }) => {
  return Array(cards)
    .fill(0)
    .map((item, i) => (
      <div key={i} className={classname}>
        <div className="card">
          <div className="flex justify-content-center align-items-center p-2">
            <div className="container notice-div">
              <Skeleton
                count={1}
                style={{
                  height: "244px",
                  marginBottom: "10px",
                }}
              />
              <div className="flex flex-col">
                <div className="flex flex-col">
                  <Skeleton
                    count={1}
                    style={{
                      width: "150px",
                      height: "20px",
                    }}
                  />
                  <Skeleton
                    count={1}
                    style={{
                      width: "150px",
                      height: "20px",
                    }}
                  />
                </div>
                <Skeleton
                  count={1}
                  style={{
                    width: "100%",
                    height: "30px",
                    marginBottom: "5px",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    ));
};

const ProfileSkeleton = ({ classname }) => {
  return (
    <div className={classname}>
      <div className="flex items-center relative gap-6">
        <div className="w-9 h-9  ">
          <Skeleton circle width={40} height={40} />
        </div>
        <Skeleton
          count={1}
          style={{
            width: "150px",
            height: "20px",
          }}
        />
      </div>
    </div>
  );
};
export default ProfileSkeleton;
