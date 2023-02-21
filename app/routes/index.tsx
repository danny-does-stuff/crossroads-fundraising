import { Button } from "~/components/Button";
import { HeroImage } from "~/components/HeroImage";

import { useOptionalUser } from "~/utils";

export default function Index() {
  const user = useOptionalUser();

  return (
    <main className="relative min-h-screen bg-white">
      <HeroImage />
      <div className="mx-4 mb-3 [&>p]:mt-3">
        <h1 className="mt-4 mb-3 text-4xl font-semibold">
          Crossroads Youth Mulch Fundraiser
        </h1>
        <h2 className="text-2xl">
          Have a Beautiful Yard. Support Local Youth.
        </h2>
        <p>
          Welcome to the Crossroads Ward Youth fundraising page. As a group we
          are raising money to be used to help fund our various programs and
          initiatives throughout the year.
        </p>

        <p>
          We're excited to announce that we are selling and spreading fresh
          mulch to help rejuvenate your garden and restore its life. Our youth
          are dedicated to not only providing high-quality mulch, but also
          providing the option to spread the mulch evenly and neatly throughout
          your garden beds.
        </p>

        <p>
          As you click to the next page, you will find that we have made the
          process as simple as possible. You will find a mulch calculator that
          you can use to help you determine how much mulch you will need in your
          yard. You will also have the option to select your neighborhood and
          the color of mulch you would like. If you do not see your neighborhood
          as an option, we unfortunately will not be able to serve your home.
        </p>

        <p>
          Orders will be delivered and spread on March 11 or March 18. We will
          confirm the specific delivery date via email a week or two before the
          Saturday when we will arrive at your home. Let's work together to
          create beautiful and healthy gardens while empowering our youth!
        </p>

        <p>
          If you have any questions, please email{" "}
          <a href="mailto:cr.youth.fundraising@gmail.com.">
            cr.youth.fundraising@gmail.com
          </a>
        </p>
        <div className="my-3 flex gap-2">
          <Button linkTo="/fundraisers/mulch/orders/new">Order Mulch</Button>
          {user?.roles.some(({ role }) => role.name === "ADMIN") && (
            <Button linkTo="/admin">Admin Dashboard</Button>
          )}
        </div>
      </div>
    </main>
  );
}
