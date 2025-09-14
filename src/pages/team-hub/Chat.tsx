import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Users,
  Hash,
  Send,
  Paperclip,
  Plus,
  Search,
  Phone,
  Video,
  MoreVertical,
  Smile,
  Image,
  File
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const channels = [
  { id: "general", name: "general", unread: 3, type: "channel" },
  { id: "operations", name: "operations", unread: 1, type: "channel" },
  { id: "support", name: "support", unread: 0, type: "channel" },
  { id: "announcements", name: "announcements", unread: 2, type: "channel" }
];

const directMessages = [
  { id: "sarah", name: "Sarah Johnson", status: "online", unread: 2 },
  { id: "mike", name: "Mike Chen", status: "online", unread: 0 },
  { id: "emma", name: "Emma Wilson", status: "away", unread: 1 },
  { id: "david", name: "David Smith", status: "offline", unread: 0 }
];

const messages = [
  {
    id: 1,
    user: "Sarah Johnson",
    avatar: "SJ",
    message: "Good morning team! Ready for another productive day 📦",
    time: "09:00 AM",
    isOwn: false,
    timestamp: new Date(Date.now() - 3600000) // 1 hour ago
  },
  {
    id: 2,
    user: "Mike Chen",
    avatar: "MC",
    message: "Morning! Just processed the overnight orders, we have 23 pending shipments",
    time: "09:05 AM",
    isOwn: false,
    timestamp: new Date(Date.now() - 3300000) // 55 minutes ago
  },
  {
    id: 3,
    user: "You",
    avatar: "YO",
    message: "Thanks Mike! I'll check the priority orders and assign them to the packing team",
    time: "09:10 AM",
    isOwn: true,
    timestamp: new Date(Date.now() - 3000000) // 50 minutes ago
  },
  {
    id: 4,
    user: "Emma Wilson",
    avatar: "EW",
    message: "I can handle the express orders if needed",
    time: "09:12 AM",
    isOwn: false,
    timestamp: new Date(Date.now() - 2880000) // 48 minutes ago
  }
];

export default function Chat() {
  const [selectedChat, setSelectedChat] = useState("general");
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getStatusIndicator = (status: string) => {
    const colors = {
      online: "bg-success",
      away: "bg-warning",
      offline: "bg-muted-foreground"
    };
    return colors[status as keyof typeof colors] || "bg-muted-foreground";
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle message sending logic
      setNewMessage("");
      setIsTyping(false);
    }
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);
    setIsTyping(value.length > 0);
  };

  const selectedChatName = selectedChat === "general" ? "#general" : 
                          channels.find(c => c.id === selectedChat)?.name || 
                          directMessages.find(dm => dm.id === selectedChat)?.name || "";

  const isChannel = channels.some(c => c.id === selectedChat);
  const selectedDM = directMessages.find(dm => dm.id === selectedChat);

  return (
    <TooltipProvider>
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* Enhanced Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          <Card className="enhanced-card">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-poppins">Team Chat</CardTitle>
                <Badge variant="outline" className="text-xs">
                  {directMessages.filter(dm => dm.status === 'online').length} online
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10 h-9 bg-muted/50 border-0 focus-visible:ring-1 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channels */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <Hash className="h-3 w-3" />
                    Channels
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent transition-colors">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Create Channel</TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-1">
                  {channels.map((channel) => (
                    <div
                      key={channel.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                        selectedChat === channel.id ? "bg-primary/10 border border-primary/20" : ""
                      }`}
                      onClick={() => setSelectedChat(channel.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{channel.name}</span>
                      </div>
                      {channel.unread > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-bounce-in">
                          {channel.unread}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Messages */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" />
                    Direct Messages
                  </span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-accent transition-colors">
                        <Plus className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>New Message</TooltipContent>
                  </Tooltip>
                </div>
                <div className="space-y-1">
                  {directMessages.map((dm) => (
                    <div
                      key={dm.id}
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 ${
                        selectedChat === dm.id ? "bg-primary/10 border border-primary/20" : ""
                      }`}
                      onClick={() => setSelectedChat(dm.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm font-medium">
                              {dm.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusIndicator(dm.status)}`} />
                        </div>
                        <span className="font-medium">{dm.name}</span>
                      </div>
                      {dm.unread > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center animate-bounce-in">
                          {dm.unread}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Main Chat Area */}
        <Card className="flex-1 flex flex-col enhanced-card overflow-hidden">
          {/* Enhanced Chat Header */}
          <CardHeader className="pb-4 border-b bg-gradient-to-r from-card to-card/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  {isChannel ? (
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Hash className="h-5 w-5 text-primary" />
                    </div>
                  ) : (
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="font-medium">
                          {selectedDM?.name.split(' ').map(n => n[0]).join('') || 'CH'}
                        </AvatarFallback>
                      </Avatar>
                      {selectedDM && (
                        <div className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${getStatusIndicator(selectedDM.status)}`} />
                      )}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-lg">{selectedChatName}</h3>
                    {selectedDM && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <div className={`h-2 w-2 rounded-full ${getStatusIndicator(selectedDM.status)}`} />
                        {selectedDM.status}
                      </p>
                    )}
                    {isChannel && (
                      <p className="text-sm text-muted-foreground">
                        {directMessages.filter(dm => dm.status === 'online').length} members online
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start Call</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
                      <Video className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Video Call</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>More Options</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardHeader>

          {/* Enhanced Messages */}
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex gap-4 animate-fade-in ${message.isOwn ? "justify-end" : ""}`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {!message.isOwn && (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="font-medium bg-gradient-primary text-white">
                        {message.avatar}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[70%] ${message.isOwn ? "text-right" : ""}`}>
                    {!message.isOwn && (
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-sm">{message.user}</span>
                        <span className="text-xs text-muted-foreground">{message.time}</span>
                      </div>
                    )}
                    <div
                      className={`relative p-4 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md ${
                        message.isOwn
                          ? "bg-gradient-primary text-white ml-4"
                          : "bg-muted/50 border border-border/50"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.message}</p>
                      {message.isOwn && (
                        <div className="absolute -bottom-1 -right-1 w-0 h-0 border-l-[8px] border-l-primary border-t-[8px] border-t-transparent" />
                      )}
                      {!message.isOwn && (
                        <div className="absolute -bottom-1 -left-1 w-0 h-0 border-r-[8px] border-r-muted/50 border-t-[8px] border-t-transparent" />
                      )}
                    </div>
                    {message.isOwn && (
                      <div className="text-xs text-muted-foreground mt-2">{message.time}</div>
                    )}
                  </div>
                  {message.isOwn && (
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="font-medium bg-gradient-secondary">
                        {message.avatar}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-4 animate-fade-in">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="font-medium">YO</AvatarFallback>
                  </Avatar>
                  <div className="max-w-[70%]">
                    <div className="bg-muted/50 border border-border/50 p-4 rounded-2xl">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Enhanced Message Input */}
          <div className="p-6 border-t bg-gradient-to-r from-card to-card/80">
            <div className="flex gap-3 items-end">
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach File</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-accent transition-colors">
                      <Image className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Upload Image</TooltipContent>
                </Tooltip>
              </div>
              
              <div className="flex-1 relative">
                <Input
                  placeholder={`Message ${selectedChatName}...`}
                  value={newMessage}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="min-h-[44px] pr-20 bg-muted/50 border-border/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent transition-colors">
                        <Smile className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Add Emoji</TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <Button 
                onClick={handleSendMessage} 
                disabled={!newMessage.trim()}
                className="btn-animated bg-gradient-primary hover:shadow-glow transition-all duration-300 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </TooltipProvider>
  );
}