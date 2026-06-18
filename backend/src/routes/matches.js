import {Router} from 'express';
import { createMatchSchema,listMatchesQuerySchema } from '../validation/matches.js';
import {db} from '../db/db.js';
import {getMatchStatus} from '../utils/match-status.js';
import {matches} from '../db/schemas/matches.schema.js'
import {desc} from 'drizzle-orm';

const matchesRouter= Router();
const MAX_LIMIT=100;

matchesRouter.get('/',async (req,res)=>{
    const parsed=listMatchesQuerySchema.safeParse(req.query);
    if(!parsed.success){
        return res.status(400).json({
            error:'Invalid query parameters',
            details:parsed.error.issues
        })
    }
    const limit=Math.min(parsed.data.limit??50,MAX_LIMIT);
    try{
        const data=await db.select().from(matches)
                   .orderBy(desc(matches.createdAt))
                   .limit(limit);
        res.status(200).json({
            message:'Matches fetched successfully',
            data
        })
    }
    catch(e){
        res.status(500).json({error:'Failed to fetch matches'})
    }
})

matchesRouter.post('/',async (req,res)=>{
    const parsed=createMatchSchema.safeParse(req.body);
    if(!parsed.success){
        return res.status(400).json({
            error:'Invalid payload',
            details:parsed.error.issues
        })
    }
    const {data: {startTime,endTime,homeScore,awayScore}}=parsed;
    try{
        //match creation logic from user input ,via extracting from parsed zod input
        const [event]=await db.insert(matches).values({
            ...parsed.data,
            startTime:new Date(startTime),
            endTime:new Date(endTime),
            homeScore:homeScore??0,
            awayScore:awayScore??0,
            status:getMatchStatus(startTime,endTime)
        }).returning();

        //broadcasting the match created to all clients
        if(res.app.locals.broadcastMatchCreated){
            res.app.locals.broadcastMatchCreated(event);
        }

        res.status(201).json({
            message:'Match created successfully',
            data:event
        });
    }
    catch(e){
        res.status(500).json({
            error:'Failed to create match',
            details:JSON.stringify(parsed.error)
        })
    }
})

export default matchesRouter;