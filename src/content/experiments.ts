import data from './experiments.json';
import type { Subject } from '../types';
export interface ExperimentDefinition {
 id:string; subject:Subject; title:string; parameterLabel:string; min:number; max:number; initial:number;
 optionLabel:string; options:string[]; targetValue:number; targetOption:number; actionLabel:string; fact:string;
}
export const experiments = data as ExperimentDefinition[];
export const getExperiment = (id:string) => experiments.find(e=>e.id===id);
export const subjects: {id:Subject;name:string;english:string;description:string}[] = [
 {id:'S',name:'科学',english:'Science',description:'探索自然现象与世界的规律'},
 {id:'T',name:'技术',english:'Technology',description:'发现工具、信号与智能装置'},
 {id:'E',name:'工程',english:'Engineering',description:'动手搭建，解决真实问题'},
 {id:'A',name:'艺术',english:'Arts',description:'用颜色、形状和节奏表达'},
 {id:'M',name:'数学',english:'Mathematics',description:'从数量、比较到空间思考'},
];
