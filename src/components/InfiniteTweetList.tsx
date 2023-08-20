import { useSession } from "next-auth/react";
import Link from "next/link";
import InfiniteScroll from "react-infinite-scroll-component";
import { ProfileImage } from "./ProfileImage";
import { VscHeart, VscHeartFilled } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";
import { LoadingSpinner } from "./LoadingSpinner";
import type { ButtonHTMLAttributes, DetailedHTMLProps } from "react";
import { api } from "~/utils/api";

type Tweet = {
  id: string;
  content: string;
  createdAt: Date;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; image: string | null; name: string | null };
};

type InfiniteTweetListProps = {
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean | undefined;
  fetchNewTweets: () => Promise<unknown>;
  tweets?: Tweet[];
};

export function InfiniteTweetList({
  tweets,
  isError,
  isLoading,
  fetchNewTweets,
  hasMore = false,
}: InfiniteTweetListProps) {
  if (isLoading) return <LoadingSpinner />;
  if (isError) return <h1>Error...</h1>;

  if (tweets == null || tweets.length === 0) {
    return (
      <h2 className="my-4 text-center text-2xl text-gray-500">No Tweets</h2>
    );
  }

  return (
    <ul>
      <InfiniteScroll
        dataLength={tweets.length}
        next={fetchNewTweets}
        hasMore={hasMore}
        loader={<LoadingSpinner />}
      >
        {tweets.map((tweet) => {
          return <TweetCard key={tweet.id} {...tweet} />;
        })}
      </InfiniteScroll>
    </ul>
  );
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "short",
});

function TweetCard({
  id,
  user,
  content,
  createdAt,
  likeCount,
  likedByMe,
}: Tweet) {
  const trpcUtils = api.useContext();
  const session = useSession()
  const toggleLike = api.tweet.toggleLike.useMutation({
    onSuccess: ({ addedLike }) => {
      const updateData: Parameters<
        typeof trpcUtils.tweet.infiniteFeed.setInfiniteData
      >[1] = (oldData) => {
        if (oldData == null) return;

        const countModifier = addedLike ? 1 : -1;

        return {
          ...oldData,
          pages: oldData.pages.map((page) => {
            return {
              ...page,
              tweets: page.tweets.map((tweet) => {
                if (tweet.id === id) {
                  return {
                    ...tweet,
                    likeCount: tweet.likeCount + countModifier,
                    likedByMe: addedLike,
                  };
                }

                return tweet;
              }),
            };
          }),
        };
      };

      trpcUtils.tweet.infiniteFeed.setInfiniteData({}, updateData);
      trpcUtils.tweet.infiniteFeed.setInfiniteData(
        { onlyFollowing: true },
        updateData
      );
      trpcUtils.tweet.infiniteProfileFeed.setInfiniteData(
        { userId: user.id },
        updateData
      );
    },
  });

  function handleToggleLike() {
    toggleLike.mutate({ id });
  }


  function handleDelete() {
    deleteTweet.mutate({ id });
  }
  const deleteTweet = api.tweet.delete.useMutation({})

  if (user.id === session.data?.user.id){
    return (
      <li className="flex gap-4 border-b px-4 py-4">
        <Link href={`/profiles/${user.id}`}>
          <ProfileImage src={user.image} />
        </Link>
        <div className="flex flex-grow flex-col">
          <div className="flex gap-1">
            <Link
              href={`/profiles/${user.id}`}
              className="font-bold outline-none hover:underline focus-visible:underline"
            >
              {user.name}
            </Link>
            <span className="text-gray-500">-</span>
            <span className="text-gray-500">
              {dateTimeFormatter.format(createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{content}</p>
          <HeartButton
            onClick={handleToggleLike}
            isLoading={toggleLike.isLoading}
            likedByMe={likedByMe}
            likeCount={likeCount}
          />
          <DeleteButton 
          onClick={handleDelete}
          className="self-end"/>
          {/* <EditButton
          className="self-end"/> */}
        </div>
      </li>
    );
  }

  else {
    return (
      <li className="flex gap-4 border-b px-4 py-4">
        <Link href={`/profiles/${user.id}`}>
          <ProfileImage src={user.image} />
        </Link>
        <div className="flex flex-grow flex-col">
          <div className="flex gap-1">
            <Link
              href={`/profiles/${user.id}`}
              className="font-bold outline-none hover:underline focus-visible:underline"
            >
              {user.name}
            </Link>
            <span className="text-gray-500">-</span>
            <span className="text-gray-500">
              {dateTimeFormatter.format(createdAt)}
            </span>
          </div>
          <p className="whitespace-pre-wrap">{content}</p>
          <HeartButton
            onClick={handleToggleLike}
            isLoading={toggleLike.isLoading}
            likedByMe={likedByMe}
            likeCount={likeCount}
          />
        </div>
      </li>
    );
  }
}

type HeartButtonProps = {
  onClick: () => void;
  isLoading: boolean;
  likedByMe: boolean;
  likeCount: number;
};

function HeartButton({
  isLoading,
  onClick,
  likedByMe,
  likeCount,
}: HeartButtonProps) {
  const session = useSession();
  const HeartIcon = likedByMe ? VscHeartFilled : VscHeart;

  if (session.status !== "authenticated") {
    return (
      <div className="mb-1 mt-1 flex items-center gap-3 self-start text-gray-500">
        <HeartIcon />
        <span>{likeCount}</span>
      </div>
    );
  }

  return (
    <button
      disabled={isLoading}
      onClick={onClick}
      className={`group -ml-2 flex items-center gap-1 self-start transition-colors duration-200 ${
        likedByMe
          ? "text-red-500"
          : "text-gray-500 hover:text-red-500 focus-visible:text-red-500"
      }`}
    >
      <IconHoverEffect red>
        <HeartIcon
          className={`transition-colors duration-200 ${
            likedByMe
              ? "fill-red-500"
              : "fill-gray-500 group-hover:fill-red-500 group-focus-visible:fill-red-500"
          }`}
        />
      </IconHoverEffect>
      <span>{likeCount}</span>
    </button>
  );
}

type delButtonProps = {
  small?: boolean;
  gray?: boolean;
  className?: string;
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

function DeleteButton({
  small = false,
  gray = false,
  className = "",
  ...props
}: delButtonProps) {
  const sizeClasses = small ? "px-2 py-1" : "px-3 py-1 font-bold";
  const colorClasses = gray ? "bg-gray-400 hover:bg-gray-300 focus-visible:bg-gray-300" : "bg-red-500 hover:bg-red-400 focus-visible:bg--400";

  return (
    <button
      className={`rounded-full text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${colorClasses} ${className}`}
      {...props}
    >Delete</button>
  );
}

// type editButtonProps = {
//   small?: boolean;
//   gray?: boolean;
//   className?: string;
// } & DetailedHTMLProps<
//   ButtonHTMLAttributes<HTMLButtonElement>,
//   HTMLButtonElement
// >;

// function EditButton({
//   small = false,
//   gray = false,
//   className = "",
//   ...props
// }: editButtonProps) {
//   const sizeClasses = small ? "px-2 py-1" : "px-3 py-1 font-bold";
//   const colorClasses = gray ? "bg-gray-400 hover:bg-gray-300 focus-visible:bg-gray-300" : "bg-green-500 hover:bg-green-400 focus-visible:bg--400";

//   return (
//     <button
//       className={`rounded-full text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${sizeClasses} ${colorClasses} ${className}`}
//       {...props}
//     >Edit</button>
//   );
// }
