
import { CheckCircle } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import React from "react";
import { FormSchema, TabValue } from "./Form";

interface FormProgressTrackerProps {
  form: UseFormReturn<FormSchema>;
  currentTab: TabValue;
  setCurrentTab: (tab: TabValue) => void;
}

// Function to check tab completion status
const getTabCompletionStatus = (
  tab: TabValue,
  values: FormSchema
): boolean => {
  switch (tab) {
    case "basic":
      return !!values.business_info.name &&
        !!values.business_info.description &&
        !!values.business_info.branding.tagline;
    case "offerings":
      return values.business_info.offerings.length > 0 &&
        values.business_info.offerings.every(o => !!o);
    case "visual":
      return !!values.business_info.design_preferences.color_palette.name;
    case "location":
      // Location is optional
      return true;
    case "contact":
      const type = values.business_info.contact_preferences.type;
      if (!type) return false;

      if (["form", "email", "subscribe"].includes(type)) {
        return !!values.business_info.contact_preferences.contact_email;
      }

      if (type === "phone") {
        return !!values.business_info.contact_preferences.contact_phone;
      }

      return false;
    default:
      return false;
  }
};

export function FormProgressTracker({ form, currentTab, setCurrentTab }: FormProgressTrackerProps) {
  const values = form.getValues();
  const tabs: { id: TabValue; label: string; required: boolean }[] = [
    { id: "basic", label: "Basic Info", required: true },
    { id: "offerings", label: "Offerings", required: true },
    { id: "visual", label: "Visual Style", required: true },
    { id: "location", label: "Location & Hours", required: false },
    { id: "contact", label: "Contact Info", required: true }
  ];
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between sm:hidden">
        <button
          type="button"
          onClick={() => {
            const currentIndex = tabs.findIndex(t => t.id === currentTab);
            if (currentIndex > 0) {
              setCurrentTab(tabs[currentIndex - 1].id);
            }
          }}
          disabled={tabs.findIndex(t => t.id === currentTab) === 0}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Previous
        </button>

        <div className="text-sm font-medium">
          Step {tabs.findIndex(t => t.id === currentTab) + 1} of {tabs.length}
        </div>

        <button
          type="button"
          onClick={() => {
            const currentIndex = tabs.findIndex(t => t.id === currentTab);
            if (currentIndex < tabs.length - 1) {
              setCurrentTab(tabs[currentIndex + 1].id);
            }
          }}
          disabled={tabs.findIndex(t => t.id === currentTab) === tabs.length - 1}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <div className="hidden sm:flex items-center justify-between">
        {tabs.map((tab, index) => {
          const isComplete = getTabCompletionStatus(tab.id, values);
          const isCurrent = tab.id === currentTab;
          const currentTabIndex = tabs.findIndex(t => t.id === currentTab);

          // Calculate connector line styles (not for the last item)
          const connectorClass = index < tabs.length - 1
            ? "flex-1 h-0.5 mx-2 " + (
              // If previous steps are complete up to this point
              index < currentTabIndex
                ? "bg-primary"
                : "bg-gray-200"
            )
            : "";

          return (
            <React.Fragment key={tab.id}>
              <button
                type="button"
                onClick={() => setCurrentTab(tab.id)}
                className="flex flex-col items-center group"
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-full 
                  ${isCurrent
                    ? "bg-primary text-white"
                    : isComplete
                      ? "bg-white border border-gray-300 text-black"
                      : index < currentTabIndex
                        ? "bg-primary text-white"
                        : "bg-white border border-gray-300 text-gray-400"
                  }
                  transition-colors duration-200
                `}>
                  {isComplete && !isCurrent ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                <span className={`
                  mt-1.5 text-xs font-medium
                  ${isCurrent
                    ? "text-black"
                    : "text-gray-500"
                  }
                `}>
                  {tab.label}
                  {tab.required && <span className="text-red-500 text-xs ml-0.5">*</span>}
                </span>
              </button>

              {index < tabs.length - 1 && (
                <div className={connectorClass} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
