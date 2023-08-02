import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { VscAccount, VscHome, VscSignIn, VscSignOut } from "react-icons/vsc";
import { IconHoverEffect } from "./IconHoverEffect";
import { useMemo } from "react";
import { useRouter } from "next/router";
import classNames from "classnames";


export function SideNav() {
  const session = useSession();
  const user = session.data?.user;
  const router = useRouter();
  
  const NAV = [
    {id: 1, tabName: "Home", icon: <VscHome className="h-8 w-8 text-white"/> ,route: "/"},
    {id: 2, tabName: "Profile", icon: <VscAccount className="h-8 w-8 text-white"/> ,route: `/profiles/${user?.id}` },
  ];

  const activeMenu = useMemo(
    () => NAV.find((menu) => menu.route === router.asPath),
    [router.pathname]
  );

  const getNavItemClasses = (menu: { route: string | undefined; }) => {
    return classNames(
      "flex items-center gap-4 flex-grow p-2 focus-visible:bg-gray-500",
      {
        ["border-l-4 border-b-blue-500 font-bold"]: activeMenu?.route === menu.route,
      }
    );
  };
  

  return (
    <nav className="sticky top-0 px-2 py-4 bg-black">
      <ul className="flex flex-col items-start gap-2 whitespace-nowrap">
      {NAV.map(({ id: ID, ...menu }) => {
            const classes = getNavItemClasses(menu);
            return (
              <div className={classes}>
                <Link href={menu.route}>
                  <IconHoverEffect>
                      <span className="flex items-center gap-4 flex-grow p-2 focus-visible:bg-gray-500">
                        <div>{menu.icon}</div>
                        <span className="hidden text-lg md:inline text-white">{menu.tabName}</span>
                      </span>
                  </IconHoverEffect>
                </Link>
              </div>
            )
          })}
        {user == null ? (
          <li>
            <button onClick={() => void signIn()}>
              <IconHoverEffect>
                <span className="flex items-center gap-4">
                  <VscSignIn className="h-8 w-8 fill-green-700" />
                  <span className="hidden text-lg text-green-700 md:inline">
                    Log In
                  </span>
                </span>
              </IconHoverEffect>
            </button>
          </li>
        ) : (
          <li>
            <button onClick={() => void signOut()}>
              <IconHoverEffect>
                <span className="flex items-center gap-4">
                  <VscSignOut className="h-8 w-8 fill-red-700" />
                  <span className="hidden text-lg text-red-700 md:inline">
                    Log Out
                  </span>
                </span>
              </IconHoverEffect>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}
