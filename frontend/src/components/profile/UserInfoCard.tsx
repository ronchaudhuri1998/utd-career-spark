import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { User, Mail, Phone, MapPin, Calendar } from "lucide-react";

interface UserInfoCardProps {
  name: string;
  email: string;
  phone: string;
  location: string;
  graduationYear: string;
  isEditing?: boolean;
  onNameChange?: (value: string) => void;
  onEmailChange?: (value: string) => void;
  onPhoneChange?: (value: string) => void;
  onLocationChange?: (value: string) => void;
  onGraduationYearChange?: (value: string) => void;
}

const UserInfoCard = ({
  name,
  email,
  phone,
  location,
  graduationYear,
  isEditing = false,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onLocationChange,
  onGraduationYearChange,
}: UserInfoCardProps) => {
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="w-24 h-24 bg-gradient-primary rounded-full mx-auto mb-4 flex items-center justify-center">
          <User className="w-12 h-12 text-primary-foreground" />
        </div>
        {isEditing ? (
          <Input
            value={name}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder="Enter your name"
            className="text-xl text-center font-bold"
          />
        ) : (
          <CardTitle className="text-xl">{name || "No name"}</CardTitle>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <Mail className="w-4 h-4 text-muted-foreground" />
          {isEditing ? (
            <Input
              value={email}
              onChange={(e) => onEmailChange?.(e.target.value)}
              placeholder="Enter your email"
              className="flex-1"
            />
          ) : (
            <span>{email || "No email"}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Phone className="w-4 h-4 text-muted-foreground" />
          {isEditing ? (
            <Input
              value={phone}
              onChange={(e) => onPhoneChange?.(e.target.value)}
              placeholder="Enter your phone"
              className="flex-1"
            />
          ) : (
            <span>{phone || "No phone"}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          {isEditing ? (
            <Input
              value={location}
              onChange={(e) => onLocationChange?.(e.target.value)}
              placeholder="Enter your location"
              className="flex-1"
            />
          ) : (
            <span>{location || "No location"}</span>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          {isEditing ? (
            <Input
              value={graduationYear}
              onChange={(e) => onGraduationYearChange?.(e.target.value)}
              placeholder="Enter graduation year"
              className="flex-1"
            />
          ) : (
            <span>
              {graduationYear
                ? `Graduating ${graduationYear}`
                : "No graduation year"}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserInfoCard;
