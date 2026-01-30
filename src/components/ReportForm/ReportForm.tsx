import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, MapPin, Clock, Upload, Trash2, FileText, AlertCircle, CheckCircle2, Loader2, Sparkles, Brain, AlertTriangle, Copy, Image, Wand2, Check, X, Cpu, Zap, ArrowLeft, ArrowRight, Building2, Phone, Mail } from "lucide-react";
import { categoryOptions, durationOptions } from "@/data/mockData";
import { IssueCategory } from "@/types";
import { apiCreateIssue, apiAnalyzeContent, MLAnalysisResult } from "@/services/api";
import { analyzeWithGemini, isGeminiConfigured } from "@/services/geminiService";
import { getDepartmentFromPincode, Department } from "@/data/departments";
import { IndianState } from "@/data/indiaLocations";

type AIMode = 'local' | 'gemini';
type ReportMode = 'choose' | 'image' | 'description';

const ReportForm = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Step wizard state
  const [reportMode, setReportMode] = useState<ReportMode>('choose');
  const [currentStep, setCurrentStep] = useState(1); // 1: choose mode, 2: fill form
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<IssueCategory | "">("");
  const [location, setLocation] = useState("");
  const [pincode, setPincode] = useState("");
  const [duration, setDuration] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageURL, setImageURL] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formProgress, setFormProgress] = useState(0);
  
  // Department state
  const [assignedDepartment, setAssignedDepartment] = useState<Department | null>(null);
  const [detectedState, setDetectedState] = useState<IndianState | null>(null);
  
  // AI Mode state - auto-selected based on report mode
  const [aiMode, setAiMode] = useState<AIMode>('local');
  const [geminiAvailable] = useState(() => isGeminiConfigured());
  
  // ML Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mlResult, setMlResult] = useState<MLAnalysisResult | null>(null);
  const [showMlSuggestions, setShowMlSuggestions] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());
  
  // Auto-select AI mode based on report mode
  useEffect(() => {
    if (reportMode === 'image') {
      setAiMode('local'); // Local ML is better for image analysis
    } else if (reportMode === 'description' && geminiAvailable) {
      setAiMode('gemini'); // Gemini is better for text understanding
    }
  }, [reportMode, geminiAvailable]);
  
  // Update department when category or pincode changes
  useEffect(() => {
    if (category && pincode && pincode.length === 6) {
      const { department, state } = getDepartmentFromPincode(category as IssueCategory, pincode);
      setAssignedDepartment(department);
      setDetectedState(state);
    } else {
      setAssignedDepartment(null);
      setDetectedState(null);
    }
  }, [category, pincode]);
  
  // Calculate form progress
  const calculateProgress = () => {
    let filled = 0;
    if (title.trim()) filled++;
    if (description.trim()) filled++;
    if (category) filled++;
    if (location.trim()) filled++;
    if (pincode.length === 6) filled++;
    if (duration) filled++;
    return (filled / 6) * 100;
  };

  // Update progress when form fields change
  useEffect(() => {
    setFormProgress(calculateProgress());
  }, [title, description, category, location, pincode, duration]);
  
  // Run ML analysis when image is added - supports both local ML and Gemini
  const runMlAnalysis = async (imageUrl: string, userDesc: string, mode: AIMode = aiMode) => {
    setIsAnalyzing(true);
    setShowMlSuggestions(false);
    setAppliedSuggestions(new Set());
    
    try {
      let result: MLAnalysisResult | null = null;
      
      if (mode === 'gemini' && geminiAvailable) {
        // Use Gemini AI for analysis
        try {
          result = await analyzeWithGemini(imageUrl, userDesc, location || undefined);
          toast({
            title: "Gemini AI Analysis Complete",
            description: "Form fields have been auto-filled using Gemini AI.",
          });
        } catch (geminiError) {
          console.error("Gemini API error:", geminiError);
          toast({
            title: "Gemini AI Error",
            description: geminiError instanceof Error ? geminiError.message : "Failed to analyze with Gemini. Falling back to local ML.",
            variant: "destructive",
          });
          // Fallback to local ML
          const response = await apiAnalyzeContent({
            imageUrl,
            description: userDesc,
            location: location || undefined
          });
          if (response.success && response.analysis) {
            result = response.analysis;
          }
        }
      } else {
        // Use local ML backend for analysis
        const response = await apiAnalyzeContent({
          imageUrl,
          description: userDesc,
          location: location || undefined
        });
        
        if (response.success && response.analysis) {
          result = response.analysis;
        }
      }
      
      if (result) {
        setMlResult(result);
        setShowMlSuggestions(true);
        
        // Auto-apply suggestions for empty fields
        if (!title.trim() && result.suggestedTitle) {
          setTitle(result.suggestedTitle);
          setAppliedSuggestions(prev => new Set([...prev, 'title']));
        }
        if (!description.trim() && result.enhancedDescription) {
          setDescription(result.enhancedDescription);
          setAppliedSuggestions(prev => new Set([...prev, 'description']));
        }
        if (!category && result.predictedCategory) {
          setCategory(result.predictedCategory);
          setAppliedSuggestions(prev => new Set([...prev, 'category']));
        }
        if (!location.trim() && result.extractedLocation) {
          setLocation(result.extractedLocation.address);
          setAppliedSuggestions(prev => new Set([...prev, 'location']));
        }
        if (!duration && result.suggestedDuration) {
          setDuration(result.suggestedDuration);
          setAppliedSuggestions(prev => new Set([...prev, 'duration']));
        }
        
        // Show warnings if needed
        if (result.isDuplicate) {
          toast({
            title: "Possible Duplicate Detected",
            description: "A similar issue may have already been reported. Please check before submitting.",
            variant: "destructive",
          });
        }
        
        if (result.isSpam) {
          toast({
            title: "Content Warning",
            description: "Your description contains patterns that may be flagged. Please review.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("ML analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the image. Please fill in the form manually.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  // Manual trigger for AI analysis
  const triggerAiAnalysis = () => {
    if (images.length > 0) {
      runMlAnalysis(images[0], description);
    } else if (description.trim()) {
      // Text-only analysis
      runMlAnalysis('', description);
    } else {
      toast({
        title: "Nothing to analyze",
        description: "Please add an image or description first.",
        variant: "destructive",
      });
    }
  };

  // Apply a single ML suggestion
  const applySuggestion = (field: string, value: string | IssueCategory) => {
    switch (field) {
      case 'title':
        setTitle(value as string);
        break;
      case 'description':
        setDescription(value as string);
        break;
      case 'category':
        setCategory(value as IssueCategory);
        break;
      case 'location':
        setLocation(value as string);
        break;
    }
    setAppliedSuggestions(prev => new Set([...prev, field]));
    toast({
      title: "Suggestion Applied",
      description: `${field.charAt(0).toUpperCase() + field.slice(1)} has been updated.`,
    });
  };
  
  // Error validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!title.trim()) newErrors.title = "Title is required";
    if (!description.trim()) newErrors.description = "Description is required";
    if (!category) newErrors.category = "Category is required";
    if (!location.trim()) newErrors.location = "Location is required";
    if (!pincode || pincode.length !== 6) newErrors.pincode = "Valid 6-digit pincode is required";
    if (!duration) newErrors.duration = "Expected resolution time is required";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle image addition from URL
  const handleAddImage = async () => {
    if (!imageURL.trim()) return;
    
    // Validate image URL
    try {
      new URL(imageURL);
      if (!images.includes(imageURL)) {
        const newImages = [...images, imageURL];
        setImages(newImages);
        
        // Trigger ML analysis with the first image and current description
        if (newImages.length === 1) {
          await runMlAnalysis(imageURL, description);
        }
      }
      setImageURL("");
    } catch (error) {
      // Invalid URL
      toast({
        title: "Invalid URL",
        description: "Please enter a valid image URL",
        variant: "destructive",
      });
    }
  };
  
  // Handle image deletion
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };
  
  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use the API to create issue with ML analysis
      const response = await apiCreateIssue({
        title,
        description,
        category: category as IssueCategory,
        location,
        pincode,
        duration,
        images,
        reportedBy: 'anonymous',
        department: assignedDepartment?.name,
        departmentShortName: assignedDepartment?.shortName,
        departmentEmail: assignedDepartment?.email,
        departmentPhone: assignedDepartment?.phone,
        state: detectedState || undefined
      });
      
      if (!response.success) {
        throw new Error(response.error || "Failed to create issue");
      }
      
      toast({
        title: "Issue reported successfully!",
        description: assignedDepartment 
          ? `Your complaint has been routed to ${assignedDepartment.shortName}.` 
          : "Thank you for reporting this issue to your community.",
      });
      
      // Redirect to the new issue page after a brief delay
      setTimeout(() => {
        navigate(`/issues/${response.issueId}`);
      }, 1500);
    } catch (error) {
      console.error("Error submitting issue:", error);
      
      toast({
        title: "Failed to report issue",
        description: "There was a problem submitting your report. Please try again.",
        variant: "destructive",
      });
      
      setIsSubmitting(false);
    }
  };

  // Get category icon color
  const getCategoryStyle = (cat: string) => {
    switch(cat) {
      case 'roads': return 'text-orange-500';
      case 'water': return 'text-blue-500';
      case 'electricity': return 'text-yellow-500';
      case 'sanitation': return 'text-green-500';
      case 'public-spaces': return 'text-purple-500';
      case 'transportation': return 'text-indigo-500';
      default: return 'text-gray-500';
    }
  };
  
  // Handle mode selection and proceed to form
  const handleModeSelect = (mode: 'image' | 'description') => {
    setReportMode(mode);
    setCurrentStep(2);
    
    toast({
      title: mode === 'image' ? "Image Mode Selected" : "Description Mode Selected",
      description: mode === 'image' 
        ? "Upload an image and we'll use AI to analyze it." 
        : "Describe your issue and Gemini AI will help fill the form.",
    });
  };
  
  // Go back to mode selection
  const handleBackToModeSelect = () => {
    setReportMode('choose');
    setCurrentStep(1);
    // Reset form
    setTitle("");
    setDescription("");
    setCategory("");
    setLocation("");
    setPincode("");
    setDuration("");
    setImages([]);
    setMlResult(null);
    setShowMlSuggestions(false);
    setAppliedSuggestions(new Set());
  };
  
  // =========================================================================
  // STEP 1: Choose Report Mode
  // =========================================================================
  if (currentStep === 1) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">How would you like to report?</h2>
          <p className="text-gray-600">Choose how you want to start your complaint</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Upload Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-500 group"
            onClick={() => handleModeSelect('image')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Image</h3>
              <p className="text-gray-600 text-sm mb-4">
                Take or upload a photo of the issue. Our AI will analyze it automatically.
              </p>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <Cpu className="h-4 w-4" />
                <span className="text-sm font-medium">Uses Local ML Analysis</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Description Option */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-500 group"
            onClick={() => handleModeSelect('description')}
          >
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Describe Issue</h3>
              <p className="text-gray-600 text-sm mb-4">
                Write about the problem in detail. Gemini AI will help fill the form.
              </p>
              <div className="flex items-center justify-center gap-2 text-purple-600">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {geminiAvailable ? "Uses Gemini AI" : "Gemini AI (Setup Required)"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Both methods support AI-powered auto-fill to make reporting faster</p>
        </div>
      </div>
    );
  }
  
  // =========================================================================
  // STEP 2: Report Form
  // =========================================================================
  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBackToModeSelect}
        className="mb-4 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Change Report Mode
      </Button>
      
      {/* Current Mode Indicator */}
      <div className="mb-4 flex items-center gap-2">
        <Badge 
          variant="outline" 
          className={reportMode === 'image' 
            ? "border-blue-500 text-blue-600 bg-blue-50" 
            : "border-purple-500 text-purple-600 bg-purple-50"
          }
        >
          {reportMode === 'image' ? (
            <>
              <Camera className="h-3 w-3 mr-1" />
              Image Mode
            </>
          ) : (
            <>
              <FileText className="h-3 w-3 mr-1" />
              Description Mode
            </>
          )}
        </Badge>
        <Badge variant="outline" className="text-gray-600">
          {aiMode === 'local' ? (
            <>
              <Cpu className="h-3 w-3 mr-1" />
              Local ML
            </>
          ) : (
            <>
              <Zap className="h-3 w-3 mr-1" />
              Gemini AI
            </>
          )}
        </Badge>
      </div>
      
      {/* Progress Bar */}
      <div className="mb-6 md:mb-8">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Form Progress</span>
          <span>{Math.round(calculateProgress())}% Complete</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FF7722] to-[#FF9F5A] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>
      
      {/* Department Assignment Banner - Shows when category + pincode are set */}
      {assignedDepartment && (
        <Card className="mb-6 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Complaint Will Be Routed To:
                </h4>
                <p className="text-green-700 font-medium mt-1">{assignedDepartment.name}</p>
                {detectedState && (
                  <p className="text-sm text-green-600 mt-0.5">State: {detectedState}</p>
                )}
                <div className="flex flex-wrap gap-4 mt-2 text-sm text-green-600">
                  {assignedDepartment.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {assignedDepartment.phone}
                    </span>
                  )}
                  {assignedDepartment.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {assignedDepartment.email}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Mode Selector */}
      <Card className="mb-6 border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
        <CardContent className="py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#FF7722] to-[#FF9F5A] rounded-lg shadow-sm">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Auto-Fill</h3>
                <p className="text-xs text-gray-500">Choose how to analyze your issue</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Local ML Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 transition-all font-medium ${
                  aiMode === 'local' 
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-md ring-2 ring-blue-300' 
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
                onClick={() => setAiMode('local')}
              >
                <Cpu className="h-4 w-4" />
                <span className="hidden sm:inline">Local ML</span>
                <span className="sm:hidden">ML</span>
              </Button>
              
              {/* Gemini AI Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 transition-all font-medium ${
                  aiMode === 'gemini' 
                    ? 'bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-md ring-2 ring-purple-300' 
                    : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50'
                } ${!geminiAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => geminiAvailable && setAiMode('gemini')}
                disabled={!geminiAvailable}
                title={!geminiAvailable ? 'Add VITE_GEMINI_API_KEY to .env to enable' : 'Use Google Gemini AI'}
              >
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Gemini AI</span>
                <span className="sm:hidden">Gemini</span>
                {!geminiAvailable && (
                  <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0 border-yellow-400 text-yellow-600 bg-yellow-50">
                    Setup Required
                  </Badge>
                )}
              </Button>
              
              {/* Manual Analyze Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-[#FF7722] text-white border-[#FF7722] hover:bg-[#E56610] shadow-md font-medium"
                onClick={triggerAiAnalysis}
                disabled={isAnalyzing || (!images.length && !description.trim())}
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Analyze</span>
              </Button>
            </div>
          </div>
          
          {/* Mode Description */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            {aiMode === 'local' ? (
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Cpu className="h-3 w-3 text-blue-500" />
                <span><strong>Local ML:</strong> Fast keyword-based analysis. Works offline, no API key needed.</span>
              </p>
            ) : (
              <p className="text-xs text-gray-500 flex items-center gap-2">
                <Zap className="h-3 w-3 text-purple-500" />
                <span><strong>Gemini AI:</strong> Advanced image & text understanding. More accurate suggestions using Google AI.</span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ML Analysis Status */}
      {isAnalyzing && (
        <Card className="mb-6 border-[#FF7722]/30 bg-gradient-to-r from-[#FF7722]/5 to-[#FF9F5A]/5 animate-pulse">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FF7722]/10 rounded-lg">
                {aiMode === 'gemini' ? (
                  <Zap className="h-5 w-5 text-purple-600 animate-pulse" />
                ) : (
                  <Brain className="h-5 w-5 text-[#FF7722] animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 flex items-center gap-2">
                  {aiMode === 'gemini' ? (
                    <>
                      <Zap className="h-4 w-4 text-purple-600" />
                      Gemini AI is analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-[#FF7722]" />
                      Local ML is analyzing...
                    </>
                  )}
                </p>
                <p className="text-sm text-gray-500">
                  {aiMode === 'gemini' 
                    ? 'Using Google Gemini for advanced image understanding' 
                    : 'Auto-filling form fields based on image content'}
                </p>
              </div>
              <Loader2 className="h-5 w-5 text-[#FF7722] animate-spin" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ML Suggestions Panel */}
      {showMlSuggestions && mlResult && !isAnalyzing && (
        <Card className={`mb-6 overflow-hidden ${
          aiMode === 'gemini' 
            ? 'border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50' 
            : 'border-[#FF7722]/30 bg-gradient-to-br from-orange-50 to-amber-50'
        }`}>
          <div className={`px-4 py-2 ${
            aiMode === 'gemini'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
              : 'bg-gradient-to-r from-[#FF7722] to-[#FF9F5A]'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                {aiMode === 'gemini' ? <Zap className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                <span className="font-semibold text-sm">
                  {aiMode === 'gemini' ? 'Gemini AI Suggestions' : 'ML Suggestions'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                onClick={() => setShowMlSuggestions(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardContent className="py-4 space-y-4">
            {/* Confidence Score */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Category Confidence:</span>
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[120px]">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF7722] to-[#FF9F5A] rounded-full"
                  style={{ width: `${mlResult.categoryConfidence * 100}%` }}
                />
              </div>
              <span className="font-medium text-[#FF7722]">{Math.round(mlResult.categoryConfidence * 100)}%</span>
            </div>

            {/* Image Quality - only show if we have an image */}
            {images.length > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Image className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Image Quality:</span>
                <Badge 
                  variant="outline" 
                  className={`capitalize ${
                    mlResult.imageQuality === 'excellent' ? 'border-green-500 text-green-600 bg-green-50' :
                    mlResult.imageQuality === 'good' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                    mlResult.imageQuality === 'fair' ? 'border-yellow-500 text-yellow-600 bg-yellow-50' :
                    'border-red-500 text-red-600 bg-red-50'
                  }`}
                >
                  {mlResult.imageQuality}
                </Badge>
              </div>
            )}

            {/* Suggested fields - only show if not already applied */}
            <div className="space-y-3 pt-2 border-t border-orange-200">
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Suggested Fields</p>
              
              {/* Title suggestion */}
              {mlResult.suggestedTitle && !appliedSuggestions.has('title') && title !== mlResult.suggestedTitle && (
                <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-orange-100">
                  <FileText className="h-4 w-4 text-[#FF7722] mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Suggested Title</p>
                    <p className="text-sm text-gray-900 truncate">{mlResult.suggestedTitle}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-[#FF7722] text-[#FF7722] hover:bg-[#FF7722] hover:text-white shrink-0"
                    onClick={() => applySuggestion('title', mlResult.suggestedTitle)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                </div>
              )}

              {/* Category suggestion */}
              {mlResult.predictedCategory && !appliedSuggestions.has('category') && category !== mlResult.predictedCategory && (
                <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-orange-100">
                  <AlertCircle className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Predicted Category</p>
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 capitalize">
                      {mlResult.predictedCategory.replace('-', ' ')}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-[#FF7722] text-[#FF7722] hover:bg-[#FF7722] hover:text-white shrink-0"
                    onClick={() => applySuggestion('category', mlResult.predictedCategory)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                </div>
              )}

              {/* Location from EXIF */}
              {mlResult.extractedLocation && !appliedSuggestions.has('location') && location !== mlResult.extractedLocation.address && (
                <div className="flex items-start gap-2 p-2 bg-white rounded-lg border border-orange-100">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-1">Location from Image</p>
                    <p className="text-sm text-gray-900 truncate">{mlResult.extractedLocation.address}</p>
                    <p className="text-xs text-gray-400">
                      Confidence: {Math.round(mlResult.extractedLocation.confidence * 100)}%
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs border-[#FF7722] text-[#FF7722] hover:bg-[#FF7722] hover:text-white shrink-0"
                    onClick={() => applySuggestion('location', mlResult.extractedLocation!.address)}
                  >
                    <Wand2 className="h-3 w-3 mr-1" />
                    Apply
                  </Button>
                </div>
              )}
            </div>

            {/* Warnings */}
            {(mlResult.isDuplicate || mlResult.isSpam) && (
              <div className="space-y-2 pt-2 border-t border-orange-200">
                {mlResult.isDuplicate && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border border-yellow-200 text-sm">
                    <Copy className="h-4 w-4 text-yellow-600 shrink-0" />
                    <span className="text-yellow-700">
                      Similar issue may exist ({Math.round((mlResult.duplicateSimilarity || 0) * 100)}% match)
                    </span>
                  </div>
                )}
                {mlResult.isSpam && (
                  <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200 text-sm">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-red-700">Content may be flagged - please review</span>
                  </div>
                )}
              </div>
            )}

            {/* Applied summary */}
            {appliedSuggestions.size > 0 && (
              <div className="flex items-center gap-2 pt-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>Applied {appliedSuggestions.size} suggestion(s)</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Title */}
        <Card className={`transition-all duration-200 ${errors.title ? 'border-red-300 shadow-red-100' : 'hover:shadow-md'}`}>
          <CardContent className="pt-6">
            <Label htmlFor="title" className="text-base flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-[#FF7722]/10 rounded-lg">
                <FileText className="h-4 w-4 text-[#FF7722]" />
              </div>
              Issue Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Brief title describing the issue (e.g., 'Pothole on Main Street')"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`text-base ${errors.title ? "border-red-300 focus:ring-red-500" : "focus:ring-[#FF7722]"}`}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.title}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Description */}
        <Card className={`transition-all duration-200 ${errors.description ? 'border-red-300 shadow-red-100' : 'hover:shadow-md'}`}>
          <CardContent className="pt-6">
            <Label htmlFor="description" className="text-base flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Provide detailed information about the issue. Include any relevant details that would help in resolving it..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`text-base resize-none ${errors.description ? "border-red-300 focus:ring-red-500" : "focus:ring-[#FF7722]"}`}
              disabled={isSubmitting}
            />
            <div className="flex justify-between mt-2">
              {errors.description ? (
                <p className="text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.description}
                </p>
              ) : (
                <span className="text-xs text-gray-400">Be as descriptive as possible</span>
              )}
              <span className="text-xs text-gray-400">{description.length} characters</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Category */}
        <Card className={`transition-all duration-200 ${errors.category ? 'border-red-300 shadow-red-100' : 'hover:shadow-md'}`}>
          <CardContent className="pt-6">
            <Label htmlFor="category" className="text-base flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <AlertCircle className="h-4 w-4 text-purple-600" />
              </div>
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={category}
              onValueChange={(value) => setCategory(value as IssueCategory)}
              disabled={isSubmitting}
            >
              <SelectTrigger 
                id="category"
                className={`text-base ${errors.category ? "border-red-300" : ""}`}
              >
                <SelectValue placeholder="Select issue category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="py-3">
                    <span className={getCategoryStyle(option.value)}>{option.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.category}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Location */}
        <Card className={`transition-all duration-200 ${errors.location ? 'border-red-300 shadow-red-100' : 'hover:shadow-md'}`}>
          <CardContent className="pt-6">
            <Label htmlFor="location" className="text-base flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <MapPin className="h-4 w-4 text-green-600" />
              </div>
              Location <span className="text-red-500">*</span>
            </Label>
            <Input
              id="location"
              placeholder="Enter the location (e.g., MG Road near Central Mall, Pune)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={`text-base ${errors.location ? "border-red-300" : ""}`}
              disabled={isSubmitting}
            />
            {errors.location && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.location}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">Include street name, landmarks, or area for better identification</p>
          </CardContent>
        </Card>
        
        {/* Pincode Input */}
        <Card className={`transition-all duration-200 ${errors.pincode ? 'border-red-300 shadow-red-100' : 'hover:shadow-md'}`}>
          <CardContent className="pt-6">
            <Label htmlFor="pincode" className="text-base flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Building2 className="h-4 w-4 text-indigo-600" />
              </div>
              Pincode <span className="text-red-500">*</span>
              {detectedState && (
                <Badge variant="outline" className="ml-2 text-xs border-green-500 text-green-600 bg-green-50">
                  {detectedState}
                </Badge>
              )}
            </Label>
            <Input
              id="pincode"
              placeholder="Enter 6-digit pincode (e.g., 411001)"
              value={pincode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setPincode(value);
              }}
              className={`text-base ${errors.pincode ? "border-red-300" : ""}`}
              disabled={isSubmitting}
              maxLength={6}
            />
            {errors.pincode && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.pincode}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Pincode helps route your complaint to the correct state department
            </p>
          </CardContent>
        </Card>
        
        {/* Expected Resolution Time */}
        <Card className={`transition-all duration-200 ${errors.duration ? 'border-red-300 shadow-red-100' : 'hover:shadow-md'}`}>
          <CardContent className="pt-6">
            <Label htmlFor="duration" className="text-base flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
              How long has this issue existed? <span className="text-red-500">*</span>
            </Label>
            <Select
              value={duration}
              onValueChange={setDuration}
              disabled={isSubmitting}
            >
              <SelectTrigger 
                id="duration"
                className={`text-base ${errors.duration ? "border-red-300" : ""}`}
              >
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {durationOptions.map((option) => (
                  <SelectItem key={option} value={option} className="py-3">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.duration && (
              <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {errors.duration}
              </p>
            )}
          </CardContent>
        </Card>
        
        {/* Images */}
        <Card className="transition-all duration-200 hover:shadow-md">
          <CardContent className="pt-6">
            <Label className="text-base flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-pink-100 rounded-lg">
                <Camera className="h-4 w-4 text-pink-600" />
              </div>
              Add Images
              <span className="text-xs text-gray-400 font-normal ml-2">(Optional but recommended)</span>
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Paste image URL here"
                value={imageURL}
                onChange={(e) => setImageURL(e.target.value)}
                disabled={isSubmitting}
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImage();
                  }
                }}
              />
              <Button 
                type="button" 
                onClick={handleAddImage}
                disabled={!imageURL.trim() || isSubmitting}
                className="bg-[#FF7722] hover:bg-[#FF7722]/90"
              >
                <Upload className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
            
            {/* Image previews */}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="aspect-video">
                      <img
                        src={image}
                        alt={`Issue image ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="shadow-lg"
                        onClick={() => handleRemoveImage(index)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-medium text-gray-600">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                <Camera className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No images added yet</p>
                <p className="text-gray-400 text-xs mt-1">Add image URLs to help illustrate the issue</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Submit Button */}
        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-[#FF7722] to-[#FF9F5A] hover:from-[#FF7722]/90 hover:to-[#FF9F5A]/90 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Submit Report
              </>
            )}
          </Button>
          <p className="text-center text-xs text-gray-400 mt-3">
            Your report will be reviewed and forwarded to the appropriate authorities
          </p>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;
