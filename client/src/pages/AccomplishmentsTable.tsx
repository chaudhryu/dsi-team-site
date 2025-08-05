import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import DatePicker from "../components/form/date-picker";
import Label from "../components/form/Label";

type Person = {
  name: string;
  role: string;
  imageUrl: string;
};

const people: Person[] = [
  {
    name: "Sharadamani Natraj",
    role: "DIR, SYSTEMS PROJ",
    imageUrl: "/images/team/sharadaNataraj.jpg",
  },
  {
    name: "Sangjun Oh",
    role: "PRNCPL SOFTWARE ENGINEER",
    imageUrl: "/images/team/sangjunOh.jpg",
  },
  {
    name: "Trung Tu",
    role: "SOFTWARE ENGINEER",
    imageUrl: "/images/team/trungTu.jpg",
  },
  {
    name: "Joe Hang",
    role: "SR SOFTWARE ENGINEER",
    imageUrl: "/images/team/joeHang.jpg",
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
    imageUrl: "/images/team/usmanChaudhr.jpg",
  },
  {
    name: "Joel Joshy",
    role: "TRANSP ASSOCIATE I",
    imageUrl:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  },
];

export default function AccomplishmentsTable() {
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* Week filter */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-100 dark:border-white/[0.05]">
        <Label className="text-gray-700 text-theme-sm" htmlFor="week-filter">
          Filter by Week
        </Label>
        <DatePicker
          id="week-filter"
          placeholder="Select Week"
          onChange={(_, currentDateString) => setSelectedWeek(currentDateString)}
        />
        {selectedWeek && (
          <span className="text-gray-500 text-theme-xs">Showing {selectedWeek}</span>
        )}
      </div>

      {/* Table */}
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-56"
              >
                User
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Accomplishment
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {people.map((person) => (
              <TableRow key={person.name}>
                {/* User */}
                <TableCell className="px-5 py-4 text-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 overflow-hidden rounded-full">
                      <img
                        width={40}
                        height={40}
                        src={person.imageUrl}
                        alt={person.name}
                      />
                    </div>
                    <div>
                      <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {person.name}
                      </span>
                      <span className="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {person.role}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* Accomplishment placeholder – replace with real data later */}
                <TableCell className="px-5 py-4 text-gray-700 text-theme-sm dark:text-gray-300 max-w-4xl whitespace-pre-wrap">
                  —
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
