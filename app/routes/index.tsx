import { Link } from "@remix-run/react";
import { Button } from "~/components/Button";

import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();

  return (
    <main className="relative min-h-screen bg-white sm:flex sm:justify-center">
      <div className="relative sm:pb-16 sm:pt-8">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="relative min-h-[40vh] shadow-xl sm:overflow-hidden sm:rounded-2xl">
            <div className="absolute inset-0">
              <img
                className="h-full w-full object-cover"
                src="https://user-images.githubusercontent.com/1500684/157774694-99820c51-8165-4908-a031-34fc371ac0d6.jpg"
                alt="Sonic Youth On Stage"
              />
            </div>
            <div className="relative px-4 pt-16 pb-8 sm:px-6 sm:pt-24 sm:pb-14 lg:px-8 lg:pb-20 lg:pt-32">
              <div className="mx-auto mt-10 max-w-sm sm:flex sm:max-w-none sm:justify-center">
                <div className="space-y-4 sm:mx-auto sm:inline-grid sm:gap-5 sm:space-y-0">
                  <Button
                    linkTo="/fundraisers/mulch/orders/new"
                    className="flex items-center justify-center px-4 py-3 font-medium"
                  >
                    Order Mulch
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-3 [&>p]:mt-3">
            <p>
              Welcome to the Crossroads Youth Group Mulch Sale fundraiser! We
              are thrilled to be launching this campaign to raise funds for our
              group's various programs and activities.
            </p>
            <p>
              As part of our community service efforts, we will be selling
              premium quality mulch and using the proceeds to fund our programs.
              By purchasing mulch from us, not only will you be beautifying your
              own yard, but you will also be supporting the youth in our
              community. Our youth volunteers will be responsible for spreading
              the mulch at your residence, providing them with valuable work
              experience and helping them develop important life skills.
            </p>
            <p>
              Your support will help us continue to provide these valuable
              opportunities for our young participants. Your purchase will go
              towards funding our programs, purchasing equipment and supplies,
              and supporting our volunteer staff.
            </p>
            <p>
              We thank you for your support and for helping us make a positive
              impact on the lives of young people in our community. Together, we
              can make a difference!
            </p>
          </div>
          <Button linkTo="/fundraisers/mulch/orders/new">Order Mulch</Button>
          {user?.roles.some(({ role }) => role.name === "ADMIN") && (
            <Button linkTo="/admin">Admin Dashboard</Button>
          )}
        </div>
      </div>
    </main>
  );
}
