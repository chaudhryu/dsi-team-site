import PageBreadcrumb from "../components/common/PageBreadCrumb";

import PageMeta from "../components/common/PageMeta";
import ComponentCard from "../components/common/ComponentCard";
import DatePicker from "../components/form/date-picker";
import Label from "../components/form/Label";
import TextArea from "../components/form/input/TextArea";
import { useState } from "react";
import Button from "../components/ui/button/Button";
import { BoxIcon } from "../icons";
export default function Accomplishments() {
    const [message, setMessage] = useState("");

  return (
    <div>
      <PageMeta
        title="React.js Form Elements Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      <PageBreadcrumb pageTitle="Submit Accomplishment" />
      <div className="grid gap-6">
      <div className="space-y-6">
        <ComponentCard title="Weekly Accomplishment">
        <p>We are building here</p>
        <div>
          <DatePicker
            id="date-picker"
            label="Date Picker Input"
            placeholder="Select Week"
            onChange={(dates, currentDateString) => {
              // Handle your logic
              console.log({ dates, currentDateString });
            }}
          />
        </div>
        <div>
          <Label>Description</Label>
          <TextArea
            value={message}
            onChange={(value) => setMessage(value)}
            rows={6}
          />
        </div>
        <div className="flex items-center gap-5">
            <Button
              size="sm"
              variant="primary"
              startIcon={<BoxIcon className="size-5" />}
            >
              Submit Accomplishment
            </Button>
          </div>
        </ComponentCard>
        </div>
       
      </div>
    </div>
  );
}
