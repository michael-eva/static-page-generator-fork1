"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useWebsites } from "@/hooks/useWebsites";
import { use, useEffect } from "react";
import { PanelResizeHandle, Panel, PanelGroup } from "react-resizable-panels";
import {
  GripVertical,
  Globe,
  Send,
  RefreshCw,
  CheckCircle,
  X,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/app/components/FileUpload";

interface PageProps {
  params: Promise<{
    userId: string;
    projectId: string;
  }>;
}

// Define the type for changeset
interface ChangeAttribute {
  name: string;
  value: string;
}

interface Change {
  type:
    | "replaceText"
    | "replaceHTML"
    | "insertBefore"
    | "insertAfter"
    | "remove"
    | "setAttribute"
    | "addElement";
  selector: string;
  content?: string;
  attribute?: ChangeAttribute;
}

interface Changeset {
  title: string;
  description: string;
  changes: Change[];
}

export default function ProjectEditPage({ params }: PageProps) {
  const { projectId, userId } = use(params);
  const { data: websites, isLoading, error } = useWebsites(userId);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant" | "system"; content: string }>
  >([
    {
      role: "system",
      content:
        "Welcome! Ask me to make changes to your website. I can help you edit the content, styling, or add new features. You can also upload files and ask me to integrate them into your site.",
    },
  ]);
  const [previewKey, setPreviewKey] = useState(Date.now());
  const [hasPreview, setHasPreview] = useState(false);
  const [changeset, setChangeset] = useState<Changeset | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ url: string; fileName: string; fileType: string }>
  >([]);

  // Add a useEffect to refresh the preview when hasPreview changes
  useEffect(() => {
    if (hasPreview) {
      // Force a refresh when hasPreview becomes true
      const newPreviewKey = Date.now();
      console.log(`useEffect refreshing preview, new key: ${newPreviewKey}`);
      setPreviewKey(newPreviewKey);
    }
  }, [hasPreview]);

  // Function to manually refresh the preview
  const refreshPreview = () => {
    console.log("Manual preview refresh requested");
    const newPreviewKey = Date.now();
    setPreviewKey(newPreviewKey);
  };

  // Function to send prompt to the HTML editor API
  const sendPrompt = async () => {
    if (!prompt.trim()) return;

    try {
      // Add user message to chat
      const userMessage = { role: "user" as const, content: prompt };
      setMessages((prev) => [...prev, userMessage]);
      setPrompt("");
      setIsSubmitting(true);

      // Clear any previous changeset
      setChangeset(null);

      // Prepare the prompt with any uploaded files
      let enhancedPrompt = prompt;
      if (uploadedFiles.length > 0) {
        const fileList = uploadedFiles
          .map((file) => `${file.fileName} (${file.fileType}): ${file.url}`)
          .join("\n");
        enhancedPrompt = `${prompt}\n\nUploaded files to use:\n${fileList}`;
      }

      // Call the edit-html API
      const response = await fetch("/api/edit-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: projectId,
          prompt: enhancedPrompt,
          action: "edit",
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store changeset if available
        if (data.changeset) {
          setChangeset(data.changeset);

          // Add assistant response with changeset details
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `I've made the following changes: "${data.changeset.title}"\n\n${data.changeset.description}\n\nYou can review them in the preview panel.`,
            },
          ]);
        } else {
          // Standard success message if no changeset
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                "I've created a preview of your requested changes. You can review them in the preview panel.",
            },
          ]);
        }

        // Add a system message with deploy option
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "PREVIEW_READY",
          },
        ]);

        // Set hasPreview to true and refresh the preview
        setHasPreview(true);

        // Force a refresh of the iframe by updating the previewKey with a unique timestamp
        const newPreviewKey = Date.now();
        console.log(`Setting new preview key: ${newPreviewKey}`);
        setPreviewKey(newPreviewKey);
      } else {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${data.message}${
              data.raw_response
                ? "\n\nRaw AI response has been logged to console."
                : ""
            }`,
          },
        ]);

        if (data.raw_response) {
          console.log("Raw AI response:", data.raw_response);
        }
      }
    } catch (error) {
      console.error("Error sending prompt:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request.",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to handle file upload completion
  const handleFileUpload = (
    url: string,
    fileName: string,
    fileType: string
  ) => {
    const newFile = { url, fileName, fileType };
    setUploadedFiles((prev) => [...prev, newFile]);

    // Add a message to the chat showing the file was uploaded
    setMessages((prev) => [
      ...prev,
      {
        role: "system",
        content: `File uploaded: ${fileName} (${fileType})`,
      },
    ]);
  };

  // Function to remove an uploaded file
  const removeUploadedFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Function to deploy changes
  const deployChanges = async () => {
    try {
      setIsSubmitting(true);

      // Call the edit-html API with deploy action
      const response = await fetch("/api/edit-html", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          siteId: projectId,
          action: "deploy",
          html: "USE_PREVIEW", // The API will use the latest preview
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Add success message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Changes deployed successfully! Your site has been updated.`,
          },
        ]);

        // Reset the preview state since changes are now deployed
        setHasPreview(false);
        setChangeset(null);
        setPreviewKey(Date.now());
      } else {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error deploying changes: ${data.message}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error deploying changes:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error deploying your changes.",
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render a change description
  const renderChange = (change: Change, index: number) => {
    const getChangeIcon = (type: string) => {
      switch (type) {
        case "replaceText":
        case "replaceHTML":
          return "🔄";
        case "insertBefore":
        case "insertAfter":
        case "addElement":
          return "➕";
        case "remove":
          return "🗑️";
        case "setAttribute":
          return "🔧";
        default:
          return "✨";
      }
    };

    const getChangeDescription = (change: Change) => {
      switch (change.type) {
        case "replaceText":
          return `Replace text in "${
            change.selector
          }" with "${change.content?.substring(0, 20)}${
            change.content && change.content.length > 20 ? "..." : ""
          }"`;
        case "replaceHTML":
          return `Replace HTML in "${change.selector}"`;
        case "insertBefore":
          return `Insert content before "${change.selector}"`;
        case "insertAfter":
          return `Insert content after "${change.selector}"`;
        case "remove":
          return `Remove "${change.selector}"`;
        case "setAttribute":
          return change.attribute
            ? `Set attribute "${change.attribute.name}" to "${change.attribute.value}" on "${change.selector}"`
            : `Set attribute on "${change.selector}"`;
        case "addElement":
          return `Add element inside "${change.selector}"`;
        default:
          return `Change to "${change.selector}"`;
      }
    };

    return (
      <div
        key={index}
        className="p-2 bg-muted rounded-lg mb-2 text-sm flex items-start"
      >
        <span className="mr-2">{getChangeIcon(change.type)}</span>
        <div className="flex-1">
          <div>{getChangeDescription(change)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <span className="font-mono bg-background px-1 py-0.5 rounded">
              {change.selector}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading)
    return (
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4" />{" "}
        {/* Title skeleton */}
        <PanelGroup
          direction="horizontal"
          className="min-h-[calc(100vh-200px)]"
        >
          {/* Preview Panel Skeleton */}
          <Panel defaultSize={75} minSize={50} maxSize={90}>
            <Card className="h-full flex flex-col">
              <CardHeader>
                <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />{" "}
                {/* Card title skeleton */}
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="h-full w-full bg-gray-200 rounded-lg animate-pulse" />
              </CardContent>
            </Card>
          </Panel>

          <PanelResizeHandle>
            <GripVertical className="h-4 w-4" />
          </PanelResizeHandle>

          {/* Chat Panel Skeleton */}
          <Panel defaultSize={25} minSize={10} maxSize={50}>
            <Card className="h-full">
              <CardHeader>
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />{" "}
                {/* Chat title skeleton */}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                  <div className="h-12 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </Panel>
        </PanelGroup>
      </div>
    );

  if (error) return <div>Error loading website</div>;

  const website = websites?.find((website) => website.site_id === projectId);
  if (!website) return <div>Website not found</div>;

  return (
    <div className=" mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={refreshPreview}
          title="Refresh preview"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-4">
          {website.domain_setups[0]?.completed ? (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="rounded-full px-3 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
              >
                <svg
                  className="w-3 h-3 mr-1"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 919-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Domain Connected
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="rounded-full px-3 text-muted-foreground border-muted"
              >
                <svg
                  className="w-3 h-3 mr-1 opacity-70"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 919-9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Domain Not Connected
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={website?.project_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Globe className="mr-2 h-4 w-4" />
              View Live Site
            </Button>
          </Link>
          {hasPreview && (
            <Badge className="bg-amber-500" variant="secondary">
              Draft Preview
            </Badge>
          )}
          {website.domain_setups[0]?.completed ? (
            <Link
              href={`https://${website.domain_setups[0].domain_name}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <Globe className="mr-2 h-4 w-4" />
                Visit {website.domain_setups[0].domain_name}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" asChild>
              <Link href={`/${userId}/edit/${projectId}/domain`}>
                <Globe className="mr-2 h-4 w-4" />
                Domain Setup
              </Link>
            </Button>
          )}
        </div>
      </div>

      <PanelGroup direction="horizontal" className="min-h-[calc(100vh-200px)]">
        {/* Preview Panel */}
        <Panel defaultSize={75} minSize={50} maxSize={90}>
          <Card className="h-full flex flex-col">
            {changeset && (
              <div className="px-6 py-2 border-b">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold">{changeset.title}</h3>
                  <Badge variant="outline" className="text-xs">
                    {changeset.changes.length}{" "}
                    {changeset.changes.length === 1 ? "change" : "changes"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {changeset.description}
                </p>

                <div className="max-h-40 overflow-y-auto">
                  {changeset.changes.map((change, index) =>
                    renderChange(change, index)
                  )}
                </div>
              </div>
            )}
            <CardContent className="flex-1 p-0">
              <div
                className={`h-full w-full border rounded-lg overflow-hidden ${
                  hasPreview ? "border-amber-500 border-2" : ""
                }`}
              >
                <iframe
                  key={previewKey}
                  src={
                    hasPreview
                      ? `/api/preview-html?siteId=${projectId}&t=${previewKey}`
                      : `${website?.project_url}?t=${previewKey}`
                  }
                  className="w-full h-full"
                  title="Website Preview"
                  onLoad={() =>
                    console.log(
                      `Iframe loaded with key: ${previewKey}, hasPreview: ${hasPreview}`
                    )
                  }
                  referrerPolicy="no-referrer"
                />
              </div>
            </CardContent>
          </Card>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle>
          <GripVertical className="h-4 w-4" />
        </PanelResizeHandle>

        {/* Chat Panel */}
        <Panel
          defaultSize={25}
          minSize={10}
          maxSize={50}
          collapsible={true}
          collapsedSize={5}
          onCollapse={() => setIsChatMinimized(true)}
          onExpand={() => setIsChatMinimized(false)}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={isChatMinimized ? "hidden" : ""}>
                AI Chat
              </CardTitle>
            </CardHeader>
            <CardContent className={isChatMinimized ? "hidden" : ""}>
              <div className="flex flex-col h-[calc(100vh-300px)]">
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                  {messages.map((message, index) => {
                    if (
                      message.role === "system" &&
                      message.content === "PREVIEW_READY"
                    ) {
                      return (
                        <div key={index} className="flex justify-center my-4">
                          <Button
                            onClick={deployChanges}
                            disabled={isSubmitting}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all animate-pulse hover:animate-none"
                            size="lg"
                          >
                            Deploy Changes
                          </Button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-12"
                            : message.role === "system"
                            ? "bg-muted text-muted-foreground italic text-sm"
                            : "bg-muted mr-12 border"
                        }`}
                      >
                        {message.content}
                      </div>
                    );
                  })}
                  {isSubmitting && (
                    <div className="p-3 rounded-lg bg-muted mr-12 border">
                      <div className="flex space-x-2 items-center">
                        <div className="animate-pulse">●</div>
                        <div className="animate-pulse delay-150">●</div>
                        <div className="animate-pulse delay-300">●</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t pt-4">
                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-2">
                        Uploaded Files:
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">
                                {file.fileName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {file.fileType}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeUploadedFile(index)}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* File Upload Component */}
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Upload File:</div>
                    <FileUpload
                      onUploadComplete={handleFileUpload}
                      siteId={projectId}
                      className="mb-2"
                    />
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendPrompt();
                    }}
                    className="flex items-end gap-2"
                  >
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the changes you want to make..."
                      className="flex-1 min-h-[80px]"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSubmitting || !prompt.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </CardContent>
          </Card>
        </Panel>
      </PanelGroup>
    </div>
  );
}
