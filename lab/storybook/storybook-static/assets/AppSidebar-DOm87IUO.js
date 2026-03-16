import{j as r}from"./utils-vy3jnSxZ.js";import{C as p,g,c,r as v,k as y,v as f,w as b}from"./HugeiconsIcon-DwdWuswD.js";import{A as k}from"./AppSidebarCollapsibleMenuItem-rgJBeIT3.js";import{A as q}from"./AppSidebarFooter-7Dw1KlwY.js";import{A as h}from"./AppSidebarHeader-DlLGcFxo.js";import{A as s}from"./AppSidebarMenuItem-rq4fhZe4.js";import{A as l}from"./AppSidebarSection-59bxvE2T.js";import{f as w,g as A}from"./sidebar-Dg1rAsaG.js";const S=[{id:"sources",label:"Sources",icon:p},{id:"leads",label:"Leads",icon:g},{id:"findings",label:"Findings",icon:c},{id:"allegations",label:"Allegations",icon:v}],u={people:"dossier-people",groups:"dossier-groups",places:"dossier-places",timeline:"dossier-timeline"};function o(e){return{name:e.name,relativePath:e.relativePath,files:e.files.map(i=>({name:i.fileName,relativePath:i.relativePath})),subfolders:e.subfolders.map(i=>o(i))}}function D(e){return e?Object.keys(u).map(i=>{const a=e.sections[i];return{id:u[i],label:a.label,files:a.files.filter(t=>t.folderPath.length===1).map(t=>({name:t.fileName,relativePath:t.relativePath})),subfolders:a.tree.map(t=>o(t))}}):[]}function P({activeView:e,dossierIndex:i,onSelectView:a,onSelectDossierFilter:t,onOpenDossierDocument:m}){const d=D(i);return r.jsxs(w,{collapsible:"offcanvas",className:"border-r border-sidebar-border/60",children:[r.jsx(h,{}),r.jsxs(A,{className:"gap-0",children:[r.jsx(l,{label:"Investigation Desk",children:S.map(n=>r.jsx(s,{label:n.label,icon:n.icon,active:e===n.id,onClick:()=>a(n.id)},n.id))}),r.jsxs(l,{label:"Dossier",children:[r.jsx(s,{label:"Graph View",icon:y,active:e==="graph-view",onClick:()=>a("graph-view")}),d.map(n=>r.jsx(k,{section:n,activeView:e,onSelectView:a,onSelectDossierFilter:t,onOpenDossierDocument:m},n.id))]}),r.jsxs(l,{label:"Settings",children:[r.jsx(s,{label:"Model",icon:f,active:e==="model",onClick:()=>a("model")}),r.jsx(s,{label:"Preferences",icon:b,active:e==="preferences",onClick:()=>a("preferences")})]})]}),r.jsx(q,{})]})}P.__docgenInfo={description:"",methods:[],displayName:"AppSidebar",props:{activeView:{required:!0,tsType:{name:"ShellViewId"},description:""},dossierIndex:{required:!0,tsType:{name:"union",raw:"DossierIndexPayload | null",elements:[{name:"signature",type:"object",raw:`{
  rootPath: string
  generatedAt: string
  sections: Record<DossierSectionKey, DossierSectionIndex>
  allFiles: DossierFileItem[]
}`,signature:{properties:[{key:"rootPath",value:{name:"string",required:!0}},{key:"generatedAt",value:{name:"string",required:!0}},{key:"sections",value:{name:"Record",elements:[{name:"union",raw:"'people' | 'groups' | 'places' | 'timeline'",elements:[{name:"literal",value:"'people'"},{name:"literal",value:"'groups'"},{name:"literal",value:"'places'"},{name:"literal",value:"'timeline'"}],required:!0},{name:"signature",type:"object",raw:`{
  section: DossierSectionKey
  label: string
  files: DossierFileItem[]
  tree: DossierTreeNode[]
}`,signature:{properties:[{key:"section",value:{name:"union",raw:"'people' | 'groups' | 'places' | 'timeline'",elements:[{name:"literal",value:"'people'"},{name:"literal",value:"'groups'"},{name:"literal",value:"'places'"},{name:"literal",value:"'timeline'"}],required:!0}},{key:"label",value:{name:"string",required:!0}},{key:"files",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  section: DossierSectionKey
  relativePath: string
  fileName: string
  fileStem: string
  title: string
  folderPath: string[]
  updatedAt: string
  sizeBytes: number
}`,signature:{properties:[{key:"section",value:{name:"union",raw:"'people' | 'groups' | 'places' | 'timeline'",elements:[{name:"literal",value:"'people'"},{name:"literal",value:"'groups'"},{name:"literal",value:"'places'"},{name:"literal",value:"'timeline'"}],required:!0}},{key:"relativePath",value:{name:"string",required:!0}},{key:"fileName",value:{name:"string",required:!0}},{key:"fileStem",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"folderPath",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}},{key:"updatedAt",value:{name:"string",required:!0}},{key:"sizeBytes",value:{name:"number",required:!0}}]}}],raw:"DossierFileItem[]",required:!0}},{key:"tree",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  name: string
  relativePath: string
  files: DossierFileItem[]
  subfolders: DossierTreeNode[]
}`,signature:{properties:[{key:"name",value:{name:"string",required:!0}},{key:"relativePath",value:{name:"string",required:!0}},{key:"files",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  section: DossierSectionKey
  relativePath: string
  fileName: string
  fileStem: string
  title: string
  folderPath: string[]
  updatedAt: string
  sizeBytes: number
}`,signature:{properties:[{key:"section",value:{name:"union",raw:"'people' | 'groups' | 'places' | 'timeline'",elements:[{name:"literal",value:"'people'"},{name:"literal",value:"'groups'"},{name:"literal",value:"'places'"},{name:"literal",value:"'timeline'"}],required:!0}},{key:"relativePath",value:{name:"string",required:!0}},{key:"fileName",value:{name:"string",required:!0}},{key:"fileStem",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"folderPath",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}},{key:"updatedAt",value:{name:"string",required:!0}},{key:"sizeBytes",value:{name:"number",required:!0}}]}}],raw:"DossierFileItem[]",required:!0}},{key:"subfolders",value:{name:"Array",elements:[{name:"DossierTreeNode"}],raw:"DossierTreeNode[]",required:!0}}]}}],raw:"DossierTreeNode[]",required:!0}}]}}],raw:"Record<DossierSectionKey, DossierSectionIndex>",required:!0}},{key:"allFiles",value:{name:"Array",elements:[{name:"signature",type:"object",raw:`{
  section: DossierSectionKey
  relativePath: string
  fileName: string
  fileStem: string
  title: string
  folderPath: string[]
  updatedAt: string
  sizeBytes: number
}`,signature:{properties:[{key:"section",value:{name:"union",raw:"'people' | 'groups' | 'places' | 'timeline'",elements:[{name:"literal",value:"'people'"},{name:"literal",value:"'groups'"},{name:"literal",value:"'places'"},{name:"literal",value:"'timeline'"}],required:!0}},{key:"relativePath",value:{name:"string",required:!0}},{key:"fileName",value:{name:"string",required:!0}},{key:"fileStem",value:{name:"string",required:!0}},{key:"title",value:{name:"string",required:!0}},{key:"folderPath",value:{name:"Array",elements:[{name:"string"}],raw:"string[]",required:!0}},{key:"updatedAt",value:{name:"string",required:!0}},{key:"sizeBytes",value:{name:"number",required:!0}}]}}],raw:"DossierFileItem[]",required:!0}}]}},{name:"null"}]},description:""},onSelectView:{required:!0,tsType:{name:"signature",type:"function",raw:"(view: ShellViewId) => void",signature:{arguments:[{type:{name:"ShellViewId"},name:"view"}],return:{name:"void"}}},description:""},onSelectDossierFilter:{required:!0,tsType:{name:"signature",type:"function",raw:"(filter: DossierViewFilter) => void",signature:{arguments:[{type:{name:"DossierViewFilter"},name:"filter"}],return:{name:"void"}}},description:""},onOpenDossierDocument:{required:!0,tsType:{name:"signature",type:"function",raw:"(relativePath: string) => void",signature:{arguments:[{type:{name:"string"},name:"relativePath"}],return:{name:"void"}}},description:""}}};export{P as A};
