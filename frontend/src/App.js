@@
 const StructuredAnnotationInterface = ({ sentences, currentIndex, onIndexChange, tagStructure, onAnnotate, onDeleteAnnotation }) => {
@@
-                {currentSentence.annotations.map((annotation) => {
+                {currentSentence.annotations.map((annotation) => {
                   const canDelete = user?.role === 'admin' || annotation.user_id === user?.id;
                   return (
-                    <div key={annotation.id} className="p-3 bg-blue-50 rounded-md">
+                    <div key={annotation.id} className="p-3 bg-blue-50 rounded-md">
                       {annotation.skipped ? (
                         <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-2">
+                            <Checkbox />
                             <SkipForward className="h-4 w-4 text-orange-600" />
                             <span className="text-sm text-gray-600">
                               Skipped by User {annotation.user_id.slice(-6)}
                             </span>
                           </div>
                           {canDelete && (
                             <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteAnnotation(annotation.id, currentSentence.id); }} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
                               <Trash2 className="h-4 w-4" />
                             </button>
                           )}
                         </div>
                       ) : (
                         <div>
                           <div className="flex items-center justify-between mb-1">
                             <span className="text-sm text-gray-600">
                               by User {annotation.user_id.slice(-6)}
                             </span>
                             {canDelete && (
                               <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDeleteAnnotation(annotation.id, currentSentence.id); }} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
                                 <Trash2 className="h-4 w-4" />
                               </button>
                             )}
                           </div>
                           <div className="flex flex-wrap gap-1 mb-2">
                             {annotation.tags.map((tag, tagIdx) => (
                               <Badge 
                                 key={tagIdx} 
                                 variant={tag.valence === 'positive' ? 'default' : 'destructive'}
                                 className="text-xs"
                               >
                                 {tag.domain}: {tag.tag} ({tag.valence})
                               </Badge>
                             ))}
                           </div>
                           {annotation.notes && (
                             <p className="text-sm text-gray-600">
                               Notes: {annotation.notes}
                             </p>
                           )}
                         </div>
                       )}
                     </div>
                   );
                 })}
@@
           {/* Action Buttons */}
-          <div className="flex space-x-2">
+          <div className="flex space-x-2">
             <Button
               onClick={handleSaveAnnotation}
               disabled={selectedTags.length === 0}
               className="bg-green-600 hover:bg-green-700"
             >
               <CheckCircle className="h-4 w-4 mr-2" />
               Save Annotation
             </Button>
@@
           </div>
+          {/* Placeholder: Bulk delete selected annotations controls can be added here in next step */}
         </CardContent>
       </Card>
     </div>
   );
 };
@@