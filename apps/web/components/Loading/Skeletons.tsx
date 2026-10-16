import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

interface SkeletonProps {
  cards: number;
  classname?: string;
}

export const CommunitySkeleton: React.FC<SkeletonProps> = ({
  cards,
  classname,
}) => {
  return (
    <>
      {Array(cards)
        .fill(0)
        .map((_, i) => (
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
        ))}
    </>
  );
};

export const MentorSkeleton: React.FC<SkeletonProps> = ({
  cards,
  classname,
}) => {
  return (
    <>
      {Array(cards)
        .fill(0)
        .map((_, i) => (
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
        ))}
    </>
  );
};

interface ProfileSkeletonProps {
  classname?: string;
}

const ProfileSkeleton: React.FC<ProfileSkeletonProps> = ({ classname }) => {
  return (
    <div className={classname}>
      <div className="flex items-center relative gap-6">
        <div className="w-9 h-9">
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
