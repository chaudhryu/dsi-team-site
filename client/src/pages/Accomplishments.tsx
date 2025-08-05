import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import DatePicker from "../components/form/date-picker";
import Label from "../components/form/Label";
import TextArea from "../components/form/input/TextArea";
import Button from "../components/ui/button/Button";
import { BoxIcon } from "../icons";

// ------------------------------------------------------------------
// Temporary user object – replace with real auth context / API data
// ------------------------------------------------------------------
const currentUser = {
  name: "Usman Chaudhry",
  role: "SOFTWARE ENGINEER",
  imageUrl: "/images/team/usmanChaudhr.jpg",
};

export default function Accomplishments() {
  // List of accomplishments for the signed‑in user
  const [accomplishments, setAccomplishments] = useState([
    {
      week: "2025-07-28 → 2025-08-03",
      text: "Implemented MSAL login flow and reduced login latency by 45%.",
    },
    {
      week: "2025-08-04 → 2025-08-10",
      text: "Refactored incident form validation and added unit tests (94% coverage).",
    },
  ]);

  // Modal/form state
  const [open, setOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (!message) return; // simple client‑side guard
    setAccomplishments([
      ...accomplishments,
      {
        week: selectedWeek ?? "—",
        text: message,
      },
    ]);
    // reset + close modal
    setSelectedWeek(null);
    setMessage("");
    setOpen(false);
  };

  return (
    <div>
      <PageMeta
        title="Submit Accomplishment | TailAdmin"
        description="Weekly accomplishment submission page"
      />
      <PageBreadcrumb pageTitle="Weekly Accomplishments" />

      {/* Card wrapper */}
      <div className="grid gap-6">
        <ComponentCard title={`Your Accomplishments, ${currentUser.name}`}>          
          {/* Action button */}
          <div className="mb-6 flex justify-end">
            <Button
              size="sm"
              variant="primary"
              startIcon={<BoxIcon className="size-5" />}
              onClick={() => setOpen(true)}
            >
              Submit Weekly Accomplishment
            </Button>
          </div>

          {/* Accomplishments table */}
          <div className="max-w-full overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400 w-44"
                  >
                    Week
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
                {accomplishments.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400">
                      {item.week}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-gray-800 text-theme-sm dark:text-gray-300 whitespace-pre-wrap">
                      {item.text}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ComponentCard>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Simple modal – replace with your design system component */}
      {/* ---------------------------------------------------------- */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-md bg-white p-6 dark:bg-gray-900 shadow-lg">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Submit Weekly Accomplishment
            </h3>

            {/* Form fields */}
            <div className="space-y-4">
              <DatePicker
                id="modal-week"
                label="Select Week"
                placeholder="Select Week"
                onChange={(_, currentDateString) => setSelectedWeek(currentDateString)}
              />
              <div>
                <Label>Description</Label>
                <TextArea value={message} onChange={setMessage} rows={6} />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
