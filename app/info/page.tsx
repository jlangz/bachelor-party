'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navigation } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Home, Info } from 'lucide-react';
import { EventInfo } from '@/lib/supabase';

export default function InfoPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    fetchEventInfo();
  }, []);

  const fetchEventInfo = async () => {
    try {
      const response = await fetch('/api/event-info');
      if (response.ok) {
        const data = await response.json();
        setEventInfo(data);
      }
    } catch (error) {
      console.error('Error fetching event info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (start: string | null, end: string | null, startTime?: string | null, endTime?: string | null) => {
    if (!start || !end) return 'Dates TBA';

    const startDate = new Date(start);
    const endDate = new Date(end);

    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };

    let dateStr = '';
    if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
      dateStr = `${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} - ${endDate.getDate()}, ${endDate.getFullYear()}`;
    } else {
      dateStr = `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
    }

    // Add times if available
    if (startTime || endTime) {
      const times: string[] = [];
      if (startTime) times.push(formatTime(startTime));
      if (endTime && endTime !== startTime) times.push(formatTime(endTime));
      if (times.length > 0) {
        dateStr += ` (${times.join(' - ')})`;
      }
    }

    return dateStr;
  };

  const formatTime = (time: string) => {
    try {
      // Handle "HH:MM" or "HH:MM:SS" format
      const [hours, minutes] = time.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return time;
    }
  };

  const renderRichDescription = (richDesc: any) => {
    // Handle both HTML string and TipTap JSON formats
    if (!richDesc) return null;

    // If it's a string (HTML from editor), render it directly
    if (typeof richDesc === 'string' && richDesc.trim()) {
      // Convert multiple <br> tags to empty paragraphs for proper spacing
      let processedHtml = richDesc;
      // Replace 2+ consecutive <br> tags with empty <p> tags
      processedHtml = processedHtml.replace(/(<br\s*\/?>){2,}/gi, (match) => {
        const count = (match.match(/<br/gi) || []).length;
        return '<p></p>'.repeat(Math.floor(count / 2));
      });

      return (
        <div
          className="prose prose-invert max-w-none
                     prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-8 prose-headings:mb-4 first:prose-headings:mt-0
                     prose-h2:text-2xl prose-h3:text-xl
                     prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
                     prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                     prose-strong:text-foreground prose-strong:font-semibold
                     prose-ul:text-muted-foreground prose-ul:list-disc prose-ul:pl-6 prose-ul:mb-4 prose-ul:space-y-1
                     prose-ol:text-muted-foreground prose-ol:list-decimal prose-ol:pl-6 prose-ol:mb-4 prose-ol:space-y-1
                     prose-li:text-muted-foreground
                     prose-hr:my-8 prose-hr:border-border
                     [&>*:first-child]:mt-0 [&>*:last-child]:mb-0
                     [&_p:empty]:h-6"
          dangerouslySetInnerHTML={{ __html: processedHtml }}
        />
      );
    }

    // If it's TipTap JSON format, parse it
    if (richDesc.content && Array.isArray(richDesc.content)) {
      return (
        <div className="prose prose-invert max-w-none">
          {richDesc.content.map((node: any, index: number) => {
            if (node.type === 'paragraph') {
              return (
                <p key={index} className="mb-4 text-muted-foreground">
                  {node.content?.map((textNode: any, textIndex: number) => {
                    let text = textNode.text || '';
                    let element = <span key={textIndex}>{text}</span>;

                    if (textNode.marks) {
                      textNode.marks.forEach((mark: any) => {
                        if (mark.type === 'bold') {
                          element = <strong key={textIndex} className="text-foreground font-bold">{text}</strong>;
                        } else if (mark.type === 'italic') {
                          element = <em key={textIndex}>{text}</em>;
                        } else if (mark.type === 'link') {
                          element = (
                            <a key={textIndex} href={mark.attrs?.href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                              {text}
                            </a>
                          );
                        }
                      });
                    }

                    return element;
                  })}
                </p>
              );
            } else if (node.type === 'heading') {
              const level = node.attrs?.level || 2;
              const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
              const text = node.content?.map((n: any) => n.text).join('') || '';
              return (
                <HeadingTag key={index} className="font-bold mb-3 mt-6 text-foreground">
                  {text}
                </HeadingTag>
              );
            } else if (node.type === 'bulletList') {
              return (
                <ul key={index} className="list-disc pl-6 mb-4 text-muted-foreground">
                  {node.content?.map((listItem: any, liIndex: number) => (
                    <li key={liIndex}>
                      {listItem.content?.map((p: any) =>
                        p.content?.map((t: any) => t.text).join('')
                      ).join('')}
                    </li>
                  ))}
                </ul>
              );
            } else if (node.type === 'orderedList') {
              return (
                <ol key={index} className="list-decimal pl-6 mb-4 text-muted-foreground">
                  {node.content?.map((listItem: any, liIndex: number) => (
                    <li key={liIndex}>
                      {listItem.content?.map((p: any) =>
                        p.content?.map((t: any) => t.text).join('')
                      ).join('')}
                    </li>
                  ))}
                </ol>
              );
            } else if (node.type === 'image') {
              return (
                <img
                  key={index}
                  src={node.attrs?.src}
                  alt={node.attrs?.alt || ''}
                  className="rounded-lg my-4 max-w-full h-auto"
                />
              );
            }
            return null;
          })}
        </div>
      );
    }

    return null;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!eventInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Event information not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {eventInfo.event_name}
          </h1>
          {eventInfo.short_description && (
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {eventInfo.short_description}
            </p>
          )}
          <p className="text-lg text-muted-foreground mt-2">
            {formatDateRange(
              eventInfo.event_date_start,
              eventInfo.event_date_end,
              eventInfo.event_date_start_time,
              eventInfo.event_date_end_time
            )}
          </p>
        </div>

        {/* Key Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Dates */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">When</h3>
              <p className="text-sm text-muted-foreground">
                {formatDateRange(
                  eventInfo.event_date_start,
                  eventInfo.event_date_end,
                  eventInfo.event_date_start_time,
                  eventInfo.event_date_end_time
                )}
              </p>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Where</h3>
              <p className="text-sm text-muted-foreground">
                {eventInfo.location_name || 'Location TBA'}
              </p>
              {eventInfo.airbnb_house_name && (
                <p className="text-sm font-medium text-primary mt-2">
                  {eventInfo.airbnb_house_name}
                </p>
              )}
              {eventInfo.airbnb_address && (
                <>
                  <p className="text-xs text-muted-foreground mt-1">
                    {eventInfo.airbnb_address}
                  </p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventInfo.airbnb_address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-xs mt-2 inline-block"
                  >
                    Open in Google Maps →
                  </a>
                </>
              )}
            </CardContent>
          </Card>

          {/* Accommodations */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Accommodations</h3>
              {eventInfo.airbnb_house_name && (
                <p className="text-sm font-medium mb-1">
                  {eventInfo.airbnb_house_name}
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {eventInfo.house_beds_total} beds available
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                First come, first served
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Rich Description Section */}
        {eventInfo.rich_description && (
          <Card className="mb-12 bg-card/50 backdrop-blur border-border/50">
            <CardContent className="p-8">
              <style jsx>{`
                .tiptap-content br {
                  content: "";
                  display: block;
                  margin: 0.5em 0;
                  line-height: 1.5em;
                }
                .tiptap-content hr {
                  margin: 2rem 0;
                  border-color: rgb(39 39 42);
                }
                .tiptap-content p {
                  margin-bottom: 1.5em;
                }
                .tiptap-content p:empty {
                  margin-bottom: 1.5em;
                }
              `}</style>
              <div className="tiptap-content">
                {renderRichDescription(eventInfo.rich_description)}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule */}
        {eventInfo.schedule && eventInfo.schedule.length > 0 && (
          <Card className="mb-12 bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Calendar className="w-6 h-6 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {eventInfo.schedule.map((item, index) => (
                  <div key={index} className="flex gap-6">
                    <div className="flex-shrink-0 w-32 text-right">
                      <span className="text-sm font-medium text-primary">
                        {item.time}
                      </span>
                    </div>
                    <div className="relative flex-1 pb-6 border-l-2 border-border pl-6 last:pb-0">
                      <div className="absolute left-0 top-0 w-3 h-3 rounded-full bg-primary -translate-x-[7px]"></div>
                      <h3 className="font-semibold mb-1">{item.title}</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Important Information */}
        {eventInfo.important_info && eventInfo.important_info.length > 0 && (
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Info className="w-6 h-6 text-primary" />
                Important Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {eventInfo.important_info.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <h3 className="font-semibold text-primary">{item.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
