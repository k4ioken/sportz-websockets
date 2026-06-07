import express from 'express';

const app=express();
const PORT=8000;

app.use(express.json());

app.get('/',(req,res)=>{
    res.send('hello world');
})

app.listen(PORT,()=>{
    console.log(`server is running on port ${PORT}`);
}
)