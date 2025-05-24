import * as d3 from '../../node_modules/d3/dist/d3.min.js';

/**
 * ProgressView
 * Visualizes learner progress through the knowledge graph
 */
export class ProgressView {
    constructor(courseManager) {
        this.courseManager = courseManager;
        this.simulation = null;
    }

    render() {
        return `
            <div class="screen">
                <h2>Progress Overview</h2>
                
                <div class="progress-legend">
                    <span class="legend-item">
                        <span class="legend-color" style="background: #9ca3af"></span>
                        Unseen
                    </span>
                    <span class="legend-item">
                        <span class="legend-color" style="background: #f59e0b"></span>
                        In Progress
                    </span>
                    <span class="legend-item">
                        <span class="legend-color" style="background: #16a34a"></span>
                        Mastered
                    </span>
                    <span class="legend-item">
                        <span class="legend-color" style="background: #dc2626"></span>
                        Overdue
                    </span>
                </div>
                
                <div id="graph-container" class="graph-container"></div>
                
                <div class="progress-stats">
                    ${this.renderStats()}
                </div>
            </div>
        `;
    }

    renderStats() {
        let totalSkills = 0;
        let masteredSkills = 0;
        let inProgressSkills = 0;
        let overdueSkills = 0;
        
        for (const course of this.courseManager.getAllCourses()) {
            for (const skill of course.getAllSkills()) {
                totalSkills++;
                const state = this.courseManager.masteryState.getSkillState(skill.id);
                
                if (state.status === 'mastered') {
                    masteredSkills++;
                    if (state.next_due && this.courseManager.fsrs.isOverdue(state.next_due)) {
                        overdueSkills++;
                    }
                } else if (state.status === 'in_progress') {
                    inProgressSkills++;
                    if (state.next_due && this.courseManager.fsrs.isOverdue(state.next_due)) {
                        overdueSkills++;
                    }
                }
            }
        }
        
        const masteryPercent = totalSkills > 0 ? ((masteredSkills / totalSkills) * 100).toFixed(1) : 0;
        
        return `
            <div class="task-card">
                <h3>Overall Progress</h3>
                <p>Total Skills: ${totalSkills}</p>
                <p class="text-success">Mastered: ${masteredSkills} (${masteryPercent}%)</p>
                <p class="text-warning">In Progress: ${inProgressSkills}</p>
                <p class="text-error">Overdue for Review: ${overdueSkills}</p>
            </div>
        `;
    }

    attachEventListeners() {
        // Wait for DOM to be ready
        setTimeout(() => {
            this.createGraph();
        }, 100);
    }

    createGraph() {
        const container = document.getElementById('graph-container');
        if (!container) return;
        
        const width = container.clientWidth;
        const height = 500;
        
        // Clear any existing graph
        d3.select(container).selectAll('*').remove();
        
        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [0, 0, width, height]);
        
        // Create graph data
        const { nodes, links } = this.buildGraphData();
        
        if (nodes.length === 0) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .attr('text-anchor', 'middle')
                .style('fill', 'var(--text-secondary)')
                .text('No skills available');
            return;
        }
        
        // Create force simulation
        this.simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(80))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(30));
        
        // Create arrow markers for directed edges
        svg.append('defs').selectAll('marker')
            .data(['arrow'])
            .enter().append('marker')
            .attr('id', d => d)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .style('fill', 'var(--text-secondary)');
        
        // Create links
        const link = svg.append('g')
            .selectAll('line')
            .data(links)
            .enter().append('line')
            .style('stroke', 'var(--border-color)')
            .style('stroke-width', 2)
            .attr('marker-end', 'url(#arrow)');
        
        // Create nodes
        const node = svg.append('g')
            .selectAll('g')
            .data(nodes)
            .enter().append('g')
            .call(this.drag(this.simulation));
        
        // Add circles
        node.append('circle')
            .attr('r', 20)
            .style('fill', d => this.getNodeColor(d))
            .style('stroke', 'var(--bg-primary)')
            .style('stroke-width', 2);
        
        // Add labels
        node.append('text')
            .text(d => d.id.split(':')[1] || d.id)
            .style('fill', 'var(--text-primary)')
            .style('font-size', '10px')
            .attr('text-anchor', 'middle')
            .attr('dy', 30);
        
        // Add tooltips
        node.append('title')
            .text(d => d.title);
        
        // Update positions on tick
        this.simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);
            
            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    buildGraphData() {
        const nodes = [];
        const links = [];
        const nodeMap = new Map();
        
        // Create nodes for all skills
        for (const course of this.courseManager.getAllCourses()) {
            for (const skill of course.getAllSkills()) {
                const node = {
                    id: skill.id,
                    title: skill.title,
                    skill: skill
                };
                nodes.push(node);
                nodeMap.set(skill.id, node);
            }
        }
        
        // Create links for prerequisites
        for (const node of nodes) {
            for (const prereq of node.skill.prerequisites) {
                const sourceNode = nodeMap.get(prereq.id);
                if (sourceNode) {
                    links.push({
                        source: prereq.id,
                        target: node.id,
                        weight: prereq.weight
                    });
                }
            }
        }
        
        return { nodes, links };
    }

    getNodeColor(node) {
        const state = this.courseManager.masteryState.getSkillState(node.id);
        
        if (state.status === 'unseen') {
            return '#9ca3af'; // gray
        } else if (state.status === 'mastered') {
            if (state.next_due && this.courseManager.fsrs.isOverdue(state.next_due)) {
                return '#dc2626'; // red for overdue
            }
            return '#16a34a'; // green
        } else if (state.status === 'in_progress') {
            if (state.next_due && this.courseManager.fsrs.isOverdue(state.next_due)) {
                return '#dc2626'; // red for overdue
            }
            return '#f59e0b'; // yellow
        }
        
        return '#9ca3af'; // default gray
    }

    drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }
        
        return d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended);
    }

    destroy() {
        if (this.simulation) {
            this.simulation.stop();
            this.simulation = null;
        }
    }
}

// Add CSS for progress view
const style = document.createElement('style');
style.textContent = `
.progress-legend {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
}

.legend-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
}

.progress-stats {
    margin-top: 20px;
}

.text-success {
    color: var(--success-color);
}

.text-warning {
    color: var(--warning-color);
}

.text-error {
    color: var(--error-color);
}
`;
document.head.appendChild(style);