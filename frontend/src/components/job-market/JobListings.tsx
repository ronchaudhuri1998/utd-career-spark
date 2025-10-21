import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MapPin, DollarSign, Briefcase } from "lucide-react";
import { JobListing } from "@/types/jobMarket";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface JobListingsProps {
  listings: JobListing[];
}

export const JobListings = ({ listings }: JobListingsProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(
    listings[0] || null
  );

  // Get unique job types
  const jobTypes = useMemo(() => {
    const types = new Set(listings.map((job) => job.type));
    return ["all", ...Array.from(types)];
  }, [listings]);

  // Filter listings
  const filteredListings = useMemo(() => {
    return listings.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.skills.some((skill) =>
          skill.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesType = typeFilter === "all" || job.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [listings, searchQuery, typeFilter]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Listings</CardTitle>
          <div className="space-y-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, company, or skills..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {jobTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type === "all" ? "All Types" : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {filteredListings.length > 0 ? (
                filteredListings.map((job) => (
                  <Card
                    key={job.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedJob?.id === job.id
                        ? "border-2 border-primary bg-primary/5"
                        : "border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedJob(job)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-base leading-tight">
                          {job.title}
                        </h3>
                        <Badge variant="secondary" className="shrink-0">
                          {job.type}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {job.company}
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {job.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{job.location}</span>
                          </div>
                        )}
                        {job.salary && (
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{job.salary}</span>
                          </div>
                        )}
                        {job.posted && (
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            <span>{job.posted}</span>
                          </div>
                        )}
                      </div>
                      {job.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {job.skills.slice(0, 5).map((skill, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                          {job.skills.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.skills.length - 5} more
                            </Badge>
                          )}
                        </div>
                      )}
                      {job.description && selectedJob?.id === job.id && (
                        <p className="text-sm text-muted-foreground pt-2 border-t mt-2">
                          {job.description}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No jobs found matching your criteria.
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
            Showing {filteredListings.length} of {listings.length} listings
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
