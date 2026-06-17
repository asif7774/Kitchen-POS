import React from "react";
import Button from "components/atoms/button";
import LazyImage from "components/atoms/lazy-image";
import Card from "components/organisms/card";
import { useToast } from "hooks/useToast";
import Input from "components/atoms/input/input";
import Select from "components/atoms/select/select";
import Textarea from "components/atoms/textarea/textarea";
import Autosearch from "components/atoms/autosearch/autosearch";
import Stepper from "components/atoms/stepper/stepper";

import { useModal } from "hooks/useModal";

import { Tooltip } from "components/atoms/tooltip";
import { Tabs } from "components/organisms/tabs";
import { Dropdown } from "components/organisms/dropdown";

const Components: React.FC = () => {
  const { showToast } = useToast();
  const { showModal, hideModal } = useModal();

  const handleOpenModal = () => {
    showModal({
      title: "Delete Confirmation",
      content: (
        <p className="text-gray-600">
          Are you sure you want to delete this item? This action cannot be
          undone and all data will be permanently lost.
        </p>
      ),
      actions: (
        <>
          <Button variant="ghost" onClick={hideModal}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              hideModal();
              showToast({
                variant: "success",
                message: "Item deleted successfully.",
              });
            }}
          >
            Delete
          </Button>
        </>
      ),
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Components</h1>
        <p className="text-gray-600">
          This page showcases the global components available in the project.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
          Toast Notifications
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button
            variant="outline"
            onClick={() => {
              showToast({
                variant: "success",
                title: "Success!",
                message: "Your changes have been saved successfully.",
              });
            }}
          >
            Show Success
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              showToast({
                variant: "error",
                title: "Error",
                message: "Failed to save changes. Please try again.",
              });
            }}
          >
            Show Error
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              showToast({
                variant: "warning",
                title: "Warning",
                message: "Your session will expire in 5 minutes.",
              });
            }}
          >
            Show Warning
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              showToast({
                variant: "info",
                message: "A new software update is available.",
              });
            }}
          >
            Show Info
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              showToast({
                variant: "warning",
                title: "Persistent",
                message: "I will stay here until you close me!",
                duration: 0,
              });
            }}
          >
            Show Persistent
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Tooltips</h2>
        <div className="flex flex-wrap gap-12 items-center pt-8 pb-4">
          <Tooltip content="I am above the button!" position="top">
            <Button variant="outline">Hover Top</Button>
          </Tooltip>

          <Tooltip content="I am below the button!" position="bottom">
            <Button variant="outline">Hover Bottom</Button>
          </Tooltip>

          <Tooltip content="I am on the right!" position="right">
            <Button variant="outline">Hover Right</Button>
          </Tooltip>

          <Tooltip content="I am on the left!" position="left">
            <Button variant="outline">Hover Left</Button>
          </Tooltip>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Tabs</h2>
        <div className="bg-white/5 rounded-xl p-6 border border-gray-200 shadow-sm max-w-3xl">
          <Tabs
            tabs={[
              {
                id: "profile",
                label: "Profile",
                content: (
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Profile Information
                    </h3>
                    <p className="text-gray-600">
                      This is the profile tab content. You can put forms or
                      personal details here.
                    </p>
                  </div>
                ),
              },
              {
                id: "settings",
                label: "Settings",
                content: (
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Account Settings
                    </h3>
                    <p className="text-gray-600">
                      Configure your preferences and account security options
                      here.
                    </p>
                  </div>
                ),
              },
              {
                id: "billing",
                label: "Billing",
                content: (
                  <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Billing History
                    </h3>
                    <p className="text-gray-600">
                      View your past invoices and manage your payment methods.
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Dropdowns</h2>
        <div className="flex flex-col gap-12 bg-white/5 rounded-xl p-6 border border-gray-200 shadow-sm min-h-[300px]">
          <div className="flex justify-between items-start">
            <Dropdown
              items={[
                {
                  id: "1",
                  label: "Account Settings",
                  onClick: () => {
                    showToast({
                      title: "Account Settings",
                      message: "Navigating to settings",
                      variant: "info",
                    });
                  },
                },
                {
                  id: "2",
                  label: "Support",
                  onClick: () => {
                    showToast({
                      title: "Support",
                      message: "Opening help center",
                      variant: "info",
                    });
                  },
                },
                {
                  id: "3",
                  label: "Logout",
                  danger: true,
                  onClick: () => {
                    showToast({
                      title: "Logout",
                      message: "You have been logged out",
                      variant: "warning",
                    });
                  },
                },
              ]}
            >
              <Button variant="primary">Standard Dropdown</Button>
            </Dropdown>

            <Dropdown
              align="right"
              items={[
                {
                  id: "edit",
                  label: "Edit Post",
                  onClick: () => {
                    showToast({
                      title: "Edit",
                      message: "Editing post...",
                      variant: "info",
                    });
                  },
                },
                {
                  id: "delete",
                  label: "Delete Post",
                  danger: true,
                  onClick: () => {
                    showToast({
                      title: "Delete",
                      message: "Post deleted permanently",
                      variant: "error",
                    });
                  },
                },
              ]}
            >
              <Button variant="outline">Right Aligned Menu</Button>
            </Dropdown>
          </div>

          <div className="mt-auto pt-24 pb-8 flex justify-center border-t border-gray-100">
            <Dropdown
              items={[
                { id: "flip1", label: "I flipped upwards!", onClick: () => {} },
                {
                  id: "flip2",
                  label: "Because I hit the bottom",
                  onClick: () => {},
                },
                {
                  id: "flip3",
                  label: "Of the viewport edge",
                  onClick: () => {},
                },
                {
                  id: "flip4",
                  label: "Super smart, right?",
                  onClick: () => {},
                },
              ]}
            >
              <Button variant="secondary">
                Test Viewport Collision (Scroll Down)
              </Button>
            </Dropdown>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
          Modal Dialogs
        </h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button variant="outline" onClick={handleOpenModal}>
            Show Confirmation Modal
          </Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
          Button Variants & Sizes
        </h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Variants
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="link">Link</Button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Sizes
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="icon" icon="settings" aria-label="Settings" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              With Icons & Loading
            </h3>
            <div className="flex flex-wrap gap-4 items-center">
              <Button icon="download">Download</Button>
              <Button
                icon="arrow-right"
                iconPosition="right"
                variant="secondary"
              >
                Next Step
              </Button>
              <Button isLoading>Processing...</Button>
              <Button variant="outline" isLoading icon="save">
                Saving
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">LazyImage</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <LazyImage
              src="https://images.unsplash.com/photo-1682687220063-4742bd7fd538?q=80&w=800&auto=format&fit=crop"
              alt="Nature"
              className="w-full h-64"
            />
          </div>
          <div className="rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <LazyImage
              src="https://images.unsplash.com/photo-1682687982501-1e58f8111222?q=80&w=800&auto=format&fit=crop"
              alt="Nature 2"
              className="w-full h-64"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            title="Dashboard"
            description="A central hub for tracking analytics, metrics, and key performance indicators."
            icon="dashboard"
            href="#"
            borderColor="border-t-blue-500"
          />
          <Card
            title="Objectives"
            description="Set targets and measure your team's success with clear goals."
            icon="target"
            href="#"
            borderColor="border-t-teal-500"
          />
          <Card
            title="Deployments"
            description="Ship your application to production quickly and safely."
            icon="launch"
            href="#"
            borderColor="border-t-yellow-400"
          />
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-6 border-b pb-2">
          Inputs & Forms
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Text Inputs
            </h3>
            <Input label="Standard Input" placeholder="Enter some text..." />
            <Input label="With Default Value" defaultValue="Pre-filled text" />
            <Input label="Error State" error="This field is required" placeholder="Error input" />
            <Input label="Disabled Input" disabled placeholder="Cannot type here" />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Autosearch Dropdown
            </h3>
            <Autosearch
              label="Search Countries"
              placeholder="Start typing..."
              options={[
                { value: "us", label: "United States" },
                { value: "uk", label: "United Kingdom" },
                { value: "ca", label: "Canada" },
                { value: "au", label: "Australia" },
                { value: "de", label: "Germany" },
                { value: "fr", label: "France" },
                { value: "jp", label: "Japan" },
                { value: "in", label: "India" },
                { value: "cn", label: "China" },
              ]}
              onChange={() => {}}
              onSelectOption={() => {}}
            />
            
            <Autosearch
              label="Autosearch Error State"
              placeholder="Search..."
              error="Invalid selection"
              options={[]}
            />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Select Dropdown
            </h3>
            <Select label="Basic Select">
              <option value="">Select an option...</option>
              <option value="1">Option One</option>
              <option value="2">Option Two</option>
              <option value="3">Option Three</option>
            </Select>
            <Select label="With Many Options (Searchable)">
              <option value="">Select a country...</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="ca">Canada</option>
              <option value="au">Australia</option>
              <option value="de">Germany</option>
              <option value="fr">France</option>
              <option value="jp">Japan</option>
              <option value="in">India</option>
            </Select>
            <Select label="Error State" error="Please select an option">
              <option value="">Choose...</option>
            </Select>
            <Select label="Disabled Select" disabled>
              <option value="">Cannot choose</option>
            </Select>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Textareas
            </h3>
            <Textarea label="Standard Textarea" placeholder="Write a message..." rows={3} />
            <Textarea label="Error State" error="Message cannot be empty" rows={3} />
            <Textarea label="Disabled Textarea" disabled placeholder="Not allowed" rows={3} />
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Stepper (Number Input)
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Standard Stepper</label>
              <Stepper defaultValue={1} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Triple Digit Width (100)</label>
              <Stepper defaultValue={100} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Disabled Stepper</label>
              <Stepper value={5} disabled onChange={() => {}} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Components;
