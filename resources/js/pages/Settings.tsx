import Card from "../components/Card";
import Toggle from "../components/Toggle";
import { useState } from "react";
import Button from "../components/Button";

export default function Settings() {
    const [sms, setSms] = useState(true);
    const [email, setEmail] = useState(true);
    const [wearables, setWearables] = useState(false);

    return (
        <div className="grid gap-6">
            <Card title="Integrations" subtitle="Connect your stack">
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass p-4 flex items-center justify-between">
                        <div>
                            <div className="font-medium">ABC Fitness</div>
                            <div className="text-sm text-slate-500">Members, check‑ins, billing</div>
                        </div>
                        <Button>Connect</Button>
                    </div>
                    <div className="glass p-4 flex items-center justify-between">
                        <div>
                            <div className="font-medium">Mindbody</div>
                            <div className="text-sm text-slate-500">Bookings, classes</div>
                        </div>
                        <Button>Connect</Button>
                    </div>
                    <div className="glass p-4 flex items-center justify-between">
                        <div>
                            <div className="font-medium">Twilio SMS</div>
                            <div className="text-sm text-slate-500">Messaging</div>
                        </div>
                        <Button>Connect</Button>
                    </div>
                    <div className="glass p-4 flex items-center justify-between">
                        <div>
                            <div className="font-medium">Stripe</div>
                            <div className="text-sm text-slate-500">Payments</div>
                        </div>
                        <Button>Connect</Button>
                    </div>
                </div>
            </Card>

            <Card title="Preferences">
                <div className="grid gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">SMS Notifications</div>
                            <div className="text-sm text-slate-500">Send reminders and streak nudges</div>
                        </div>
                        <Toggle checked={sms} onChange={setSms}/>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-slate-500">Weekly summaries, offers</div>
                        </div>
                        <Toggle checked={email} onChange={setEmail}/>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">Wearable Data</div>
                            <div className="text-sm text-slate-500">Optional member opt‑in</div>
                        </div>
                        <Toggle checked={wearables} onChange={setWearables}/>
                    </div>
                </div>
            </Card>
        </div>
    );
}