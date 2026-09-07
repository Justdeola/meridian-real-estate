import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useCurrentUser } from "@/lib/auth/use-current-user";
import { CONTACT_METHODS } from "@/lib/constants";
import { requestViewing, sendInquiry } from "@/lib/server/me";
export function InquiryForm({ property }) {
  const user = useCurrentUser();
  const [name, setName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.primaryEmail ?? "");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    `I am interested in ${property.title} (${property.id}). Please send further particulars.`,
  );
  const [method, setMethod] = useState("EMAIL");
  const mutation = useMutation({
    mutationFn: () =>
      sendInquiry({
        data: {
          propertyId: property.id,
          name,
          email,
          phone: phone || undefined,
          message,
          contactMethod: method,
        },
      }),
    onSuccess: () => toast.success("Enquiry sent to the listing agent."),
    onError: (err) => toast.error(err.message || "Could not send enquiry."),
  });
  if (["SOLD", "RENTED", "UNAVAILABLE", "ARCHIVED"].includes(property.status)) {
    return (
      <p className="text-sm text-muted">
        This property is no longer available. Browse similar listings below.
      </p>
    );
  }
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!user) {
          toast.message("Sign in to contact the agent.");
          return;
        }
        mutation.mutate();
      }}
    >
      <div>
        <Label htmlFor="inq-name">Name</Label>
        <Input id="inq-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="inq-email">Email</Label>
        <Input
          id="inq-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor="inq-phone">Phone</Label>
        <Input id="inq-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="inq-method">Preferred contact</Label>
        <select
          id="inq-method"
          className="h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-sm"
          value={method}
          onChange={(e) => setMethod(e.target.value)}
        >
          {CONTACT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="inq-msg">Message</Label>
        <Textarea
          id="inq-msg"
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        Send enquiry
      </Button>
    </form>
  );
}
export function ViewingForm({ property }) {
  const user = useCurrentUser();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("11:00");
  const [message, setMessage] = useState("");
  const mutation = useMutation({
    mutationFn: () =>
      requestViewing({
        data: {
          propertyId: property.id,
          preferredDate: date,
          preferredTime: time,
          message: message || undefined,
        },
      }),
    onSuccess: () => toast.success("Viewing request sent."),
    onError: (err) => toast.error(err.message || "Could not request a viewing."),
  });
  if (
    ["SOLD", "RENTED", "UNAVAILABLE", "ARCHIVED", "DRAFT", "REJECTED"].includes(property.status)
  ) {
    return null;
  }
  const min = new Date().toISOString().slice(0, 10);
  return (
    <form
      className="mt-6 space-y-3 border-t border-line pt-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!user) {
          toast.message("Sign in to request a viewing.");
          return;
        }
        mutation.mutate();
      }}
    >
      <p className="text-xs uppercase tracking-[0.14em] text-muted">Request a viewing</p>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="view-date">Date</Label>
          <Input
            id="view-date"
            type="date"
            required
            min={min}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="view-time">Time</Label>
          <Input
            id="view-time"
            type="time"
            required
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>
      <Textarea
        placeholder="Optional note"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button type="submit" variant="secondary" className="w-full" loading={mutation.isPending}>
        Request viewing
      </Button>
    </form>
  );
}
