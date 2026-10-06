import { Mail, Sparkles } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import member01 from "@/assets/team/member-01.png";
import member02 from "@/assets/team/member-02.png";
import member03 from "@/assets/team/member-03.png";

const teamMembers = [
  {
    initials: "01",
    name: "Swan Linn Tun",
    email: "swanlinnhtun123@gmail.com",
    photo: member01,
  },
  {
    initials: "02",
    name: "Win Pa Pa Aung",
    email: "28winpapaaung@gmail.com",
    photo: member02,
  },
  {
    initials: "03",
    name: "Khin Sandakue",
    email: "khinsandakue035@gmail.com",
    photo: member03,
  },
] as const;

export default function About() {
  const { language } = useLanguage();
  const isMyanmar = language === "mm";

  return (
    <section className="mx-auto max-w-4xl">
      <div className="rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#263f5f] p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 ring-1 ring-white/15">
              <Sparkles className="size-3.5 text-amber-300" />
              MIIT Store Management System
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {isMyanmar ? "MIIT Store အကြောင်း" : "About MIIT Store"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
              {isMyanmar
                ? "ပစ္စည်းစာရင်း၊ QR ကုဒ်များ၊ လွှဲပြောင်းမှုများနှင့် လက်ပ်တော့ငှားရမ်းမှုများကို တစ်နေရာတည်းမှ ရိုးရှင်းလုံခြုံစွာ စီမံခန့်ခွဲနိုင်ရန် ဖန်တီးထားသော စနစ်ဖြစ်ပါသည်။"
                : "A focused workspace for managing inventory, QR codes, transfers, and laptop rentals in one secure place."}
            </p>
          </div>
          <div className="shrink-0 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-300">{isMyanmar ? "ဗားရှင်း" : "Version"}</p>
            <p className="mt-1 text-lg font-bold">1.0</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{isMyanmar ? "ကျွန်ုပ်တို့၏အဖွဲ့" : "Our team"}</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{isMyanmar ? "ဤစနစ်ကို ဒီဇိုင်းရေးဆွဲပြီး ဖန်တီးခဲ့သော အဖွဲ့ဝင်များ" : "The people who designed and built this system."}</p>
          </div>
          <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{isMyanmar ? "အဖွဲ့ဝင် ၃ ဦး" : "3 members"}</span>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {teamMembers.map(({ initials, name, email, photo }) => (
            <article key={initials} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md dark:border-slate-700 dark:bg-slate-900">
              <div className="mx-auto size-20 overflow-hidden rounded-full border-2 border-white shadow-sm ring-2 ring-slate-100 dark:border-slate-900 dark:ring-slate-700">
                <img
                  src={photo}
                  alt={name ?? `${isMyanmar ? "အဖွဲ့ဝင်" : "Team member"} ${initials}`}
                  className="size-full object-cover"
                />
              </div>
              <h4 className="mt-5 text-base font-semibold text-slate-950 dark:text-slate-50">{name ?? (isMyanmar ? "အမည်ထည့်ရန်" : "Add member name")}</h4>
              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <Mail className="size-4 shrink-0" />
                {email ? (
                  <a href={`mailto:${email}`} className="truncate hover:text-slate-950 hover:underline dark:hover:text-white">{email}</a>
                ) : (
                  <span>{isMyanmar ? "အီးမေးလ်လိပ်စာ ထည့်ရန်" : "Add email address"}</span>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
