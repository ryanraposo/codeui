"use strict";
// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

import * as assert from 'assert';
import * as chai from 'chai';
import {should} from 'chai';

chai.use(should);

import { isIStringAnyDict, IStringAnyDict, getGlobalWorkbenchColorCustomizations, getWorkspaceWorkbenchColorCustomizations } from '../configuration';
import { exists } from 'fs';
import { start } from 'repl';
import { ExecException } from 'child_process';



function equalTest(fn: any, arg:any, argString:string, expected:any){
    describe(fn.name.toString(), () => {
        it(argString + ' as arg should return ' + expected.toString(), () => {
            let result = fn(arg);
            result.should.equal(expected);
        });   
    });
}


function equalAnyOfTest(fn: any, arg:any, argString:string, expected:Array<any>){
    describe(fn.name.toString(), () => {
        it(argString + ' as arg should return ' + expected.toString(), () => {
            let result : any = fn(arg);
            try{
                expected.should.contain.members([result]);
            }
            catch(e){
                console.log(e.name);                
            }
        });   
    });
}


function typeTest(fn: any, arg:any, argString:string, expected:any){
    describe(fn.name.toString(), () => {
        it(argString + ' as arg should return ' + expected.toString(), () => {
            let result = fn(arg);
            result.should.be.a(expected);
        });   
    });
}


function noMembersTest(fn: any, arg:any, argString:string){
    describe(fn.name.toString(), () => {
        it(argString + ' as arg should return value with no members', () => {
            let result = fn(arg);
            result.should.be.empty;
        });   
    });
}

function addThree(arg:number){
    return arg + 3;
}

equalTest(isIStringAnyDict, undefined, "undefined", false);
equalTest(isIStringAnyDict, {}, "{}", true);
equalTest(isIStringAnyDict, {'3':'a'}, "{'3':'b'}", true);
equalTest(isIStringAnyDict, "a", "'a'", false);
equalTest(isIStringAnyDict, 3, "3", false);

typeTest(getGlobalWorkbenchColorCustomizations, null, "null", 'object');
typeTest(getWorkspaceWorkbenchColorCustomizations, null, "null", 'object');




