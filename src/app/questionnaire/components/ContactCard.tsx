import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Copy, ExternalLink, UserPlus } from 'lucide-react';

interface ContactCardProps {
    type: 'form' | 'email' | 'phone' | 'subscribe';
    selected: boolean;
    onSelect: () => void;
    email?: string;
    phoneNumber?: string;
}

const ContactCard: React.FC<ContactCardProps> = ({
    type,
    selected,
    onSelect,
    email = 'contact@company.com',
    phoneNumber = '+1 (234) 567-890'
}) => {

    return (
        <Card
            className={`min-w-72 max-w-72 p-6 rounded-lg cursor-pointer transition-shadow duration-200 hover:shadow-xl ${selected ? 'border-2 border-blue-500' : 'border border-gray-200'
                }`}
            onClick={onSelect}
        >
            {type === 'form' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        <h3 className="font-semibold">Contact Us Form</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Perfect for collecting detailed inquiries directly through your website. Visitors can send structured messages without leaving your site.
                    </p>
                    <div className="space-y-3">
                        <Input type="text" placeholder="Name" className="bg-white" />
                        <Input type="email" placeholder="Email" className="bg-white" />
                        <Input type="text" placeholder="Subject" className="bg-white" />
                        <Textarea
                            placeholder="Your message"
                            rows={4}
                            className="bg-white resize-none"
                        />
                        <div className="flex justify-end w-full">
                            <Button
                                type="button"
                                className="bg-black text-white hover:bg-gray-800"
                                size="sm"
                            >
                                Send Message
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            {type === 'email' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        <h3 className="font-semibold">Send Us an Email</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        A streamlined option that lets visitors use their preferred email client. Great for those who want to keep a record of their communication or attach files.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900">{email}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            type='button'
                        >
                            <Copy className="w-4 h-4" />
                            <span className="sr-only">Copy email</span>
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 bg-black text-white hover:bg-gray-800"
                            type='button'
                        >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Email Us
                        </Button>
                    </div>
                </div>
            )}
            {type === 'phone' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Phone className="w-5 h-5" />
                        <h3 className="font-semibold">Give Us a Call</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Best for immediate communication and urgent matters. Ideal for businesses that value direct, real-time conversations with their customers.
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-gray-900">{phoneNumber}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            type='button'
                        >
                            <Copy className="w-4 h-4" />
                            <span className="sr-only">Copy phone number</span>
                        </Button>
                        <Button
                            size="sm"
                            className="h-8 bg-black text-white hover:bg-gray-800"
                            type='button'
                        >
                            <Phone className="w-4 h-4 mr-1" />
                            Call Now
                        </Button>
                    </div>
                </div>
            )}
            {type === 'subscribe' && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        <h3 className="font-semibold">Get Early Access</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                        Perfect for pre-launches and building anticipation. Collect emails from interested customers before your product or service is ready, helping you build a mailing list from day one.
                    </p>
                    <div className="space-y-3">
                        <Input type="text" placeholder="Your Name" className="bg-white" />
                        <Input type="email" placeholder="Your Email" className="bg-white" />
                        <Input type="tel" placeholder="Your Phone (optional)" className="bg-white" />
                        <div className="flex justify-end w-full">
                            <Button
                                type="button"
                                className="bg-black text-white hover:bg-gray-800 w-full"
                                size="sm"
                            >
                                Subscribe Now
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default ContactCard;