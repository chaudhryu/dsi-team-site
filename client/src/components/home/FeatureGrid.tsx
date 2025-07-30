import { useEffect, useRef, useState } from "react";

type Person = {
  name: string;
  role: string;
  imageUrl: string;
};

const people: Person[] = [
  {
    name: "Sharadamani Natraj",
    role: "DIR, SYSTEMS PROJ ",
    imageUrl:
      "/images/team/sharadaNataraj.jpg",
  },
  {
    name: "Sangjun Oh",
    role: "PRNCPL SOFTWARE ENGINEER ",
    imageUrl:
      "/images/team/sangjunOh.jpg",
  },
  {
    name: "Trung Tu",
    role: "SOFTWARE ENGINEER",
    imageUrl:
      "/images/team/trungTu.jpg",
  },
  {
    name: "Joe Hang",
    role: "SR SOFTWARE ENGINEER",
    imageUrl:
    "/images/team/joeHang.jpg",
  },
  {
    name: "Henry Lee",
    role: "CONSULTANT",
    imageUrl:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
  {
    name: "Usman Chaudhry",
    role: "SOFTWARE ENGINEER",
    imageUrl:
    "/images/team/usmanChaudhr.jpg",
  },
  {
    name: "Joel Joshy",
    role: "TRANSP ASSOCIATE I",
    imageUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
];

export default function FeatureGrid() {
    const [visible, setVisible] = useState(false);
    const sectionRef = useRef<HTMLElement | null>(null);
  
    useEffect(() => {
      const el = sectionRef.current;
      if (!el) return;
  
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(true);          // start animation
            observer.disconnect();      // run once
          }
        },
        {
          root: null,                  // viewport
          threshold: 0.25,             // 25 % of section visible
        }
      );
  
      observer.observe(el);
      return () => observer.disconnect();
    }, []);
  
    return (
      <section
        ref={sectionRef}
        className={`bg-white dark:bg-gray-900 py-24 sm:py-32 transition-all duration-700
                    ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      >
        <div className="mx-auto grid max-w-7xl gap-20 px-6 lg:px-8 xl:grid-cols-3">
          {/* intro */}
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Meet our leadership
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              We’re a dynamic group of individuals who are passionate about what
              we do and dedicated to delivering the best results for Metro riders.
            </p>
          </div>
  
          {/* team grid */}
          <ul
            role="list"
            className="grid gap-x-8 gap-y-12 sm:grid-cols-2 sm:gap-y-16 xl:col-span-2"
          >
            {people.map((person) => (
              <li key={person.name}>
                <div className="flex items-center gap-x-6">
                  <img
                    src={person.imageUrl}
                    alt=""
                    className="
                         h-20 w-20               
                         md:h-24 md:w-24        
                         rounded-full ring-1 ring-black/5
                       "
                  />
                  <div>
                    <h3 className="text-base font-semibold leading-7 tracking-tight text-gray-900 dark:text-white">
                      {person.name}
                    </h3>
                    <p className="text-sm font-semibold leading-6 text-brand-600">
                      {person.role}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }