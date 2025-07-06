import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Upload, Link, Tag, FileSpreadsheet } from "lucide-react";
import { UploadFields } from "./UploadFields";
import { MappingUpload } from "./MappingUpload";
import { TagMappingInterface } from "./TagMappingInterface";

export const MappingInterface = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-2xl font-bold text-foreground">Mapping Configuration</h3>
          <p className="text-muted-foreground">
            Configure field mappings and upload your field definitions
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload-fields" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload-fields">Upload Fields</TabsTrigger>
          <TabsTrigger value="upload-mapping">Upload Mapping Details</TabsTrigger>
          <TabsTrigger value="unique-mapping">Unique Tag Mapping</TabsTrigger>
          <TabsTrigger value="template-mapping">Template Field Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="upload-fields" className="space-y-6">
          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Field Definitions
              </CardTitle>
              <CardDescription>
                Upload Excel or CSV files containing your field definitions. The system will extract field names for mapping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UploadFields />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload-mapping" className="space-y-6">
          <MappingUpload />
        </TabsContent>

        <TabsContent value="unique-mapping" className="space-y-6">
          <Card className="bg-gradient-card shadow-custom-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Unique Tag Mapping
              </CardTitle>
              <CardDescription>
                Configure unique mappings for specific tags.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                This functionality will be implemented soon.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="template-mapping" className="space-y-6">
          <TagMappingInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
};