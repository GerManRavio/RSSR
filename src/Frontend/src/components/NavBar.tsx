import React from 'react';
import Link from "next/link";
import LoginButton from "@/components/LoginButton";
import {auth0} from "@/lib/auth0";
import LogoutButton from "@/components/LogoutButton";

const NavBar = async () => {
  const session = await auth0.getSession();
  const user = session?.user;
  return (
          <header className="bg-black" style={{display: "flex", flexDirection: "column", flex: "0 0 auto"}}>
            <nav className="flex flex-row justify-between border-b-2 rounded-lg p-2">
              <menu className="gap-1">
                <Link href="/src/Frontend/public">Home</Link>
              </menu>
              <menu>
                {user && <span>Welcome, {user.name}</span>}
                {user ? <LogoutButton/> : <LoginButton/>}
              </menu>
            </nav>
          </header>
  );
};

export default NavBar;