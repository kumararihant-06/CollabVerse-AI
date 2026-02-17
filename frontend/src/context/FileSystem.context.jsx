import React,{createContext, useState, useContext} from 'react';

export const FileSystemContext = createContext();

export const FileSystemContextProvider = ({children}) => {

    const [files, setFiles] = useState({
        'app.js':{
            name:'app.js',
            content:'//Write your javascript code here \nconsole.log("hello world")',
            language:'javascript'
        },
        'script.py':{
            name:'script.py',
            content:'#Write your python code here\nprint("Hello world")',
            language:'python'
        }
    });

    const [activeFile, setActiveFile] = useState('app.js')
    const [output, setOutput] = useState('')
    const [isRunning, setIsRunning] = useState('false')

    const createFile = (filename,language ='javascript') =>{
        const extension = filename.split('.').pop();
        const langMap = {
            'js': 'javascript',
            'py': 'python',
            'c': 'c',
            'cpp': 'c++',
            'java': 'java'
        };

        setFiles(prev => ({
            ...prev,
            [filename]:{
                name: filename,
                content: '',
                language: langMap[extension] || language
            }
        }));
    };

    const deleteFile = (filename)=>{
        setFiles(prev => {
            const newFiles = {...prev};
            delete newFiles[filename];
            return newFiles;
        });

        if (activeFile===filename){
        const remainingFiles = Object.keys(files).filter(f => f !== filename);
        setActiveFile(remainingFiles[0] || null);
        }
    };

    const updateFileContent = (filename, content) => {
        setFiles(prev => ({
            ...prev,
            [filename]:{
                ...prev[filename],
                content
            }
        }));
    };

    return (
        <FileSystemContext.Provider values={{
            files,
            activeFile,
            setActiveFile,
            createFile,
            deleteFile,
            updateFileContent,
            output,
            setOutput,
            isRunning,
            setIsRunning
            }}>
            {children}
        </FileSystemContext.Provider>
    )
}

export const useFileSystem = () => useContext(FileSystemContext)
