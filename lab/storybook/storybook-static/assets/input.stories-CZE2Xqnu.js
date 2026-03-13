import{R as e}from"./iframe-9S5LuuTj.js";import{I as a}from"./input-xEBX65vc.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-vy3jnSxZ.js";const m={title:"ui/Input",component:a,args:{placeholder:"Digite aqui..."}},r={render:l=>e.createElement("div",{className:"w-full max-w-md p-6"},e.createElement(a,{...l}))},t={render:()=>e.createElement("div",{className:"grid w-full max-w-md gap-3 p-6"},e.createElement(a,{placeholder:"Default"}),e.createElement(a,{placeholder:"Disabled",disabled:!0}),e.createElement(a,{placeholder:"Com valor",defaultValue:"reverso-agent"}))};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: args => <div className="w-full max-w-md p-6">
      <Input {...args} />
    </div>
}`,...r.parameters?.docs?.source}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => <div className="grid w-full max-w-md gap-3 p-6">
      <Input placeholder="Default" />
      <Input placeholder="Disabled" disabled />
      <Input placeholder="Com valor" defaultValue="reverso-agent" />
    </div>
}`,...t.parameters?.docs?.source}}};const c=["Playground","States"];export{r as Playground,t as States,c as __namedExportsOrder,m as default};
